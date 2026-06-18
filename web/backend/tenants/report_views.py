from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
import csv
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Case, When, IntegerField
from decimal import Decimal

from .models import Lease, Installment, Payment
from properties.models import Property

class LandlordLeaseReportView(generics.GenericAPIView):
    """
    Generate and return a downloadable CSV report for a landlord's leases
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            user = request.user
            landlord = None
            
            # Determine the effective landlord
            if user.groups.filter(name="landlord").exists():
                landlord = user
            elif user.groups.filter(name="agent").exists():
                # Agent acting as landlord
                if hasattr(request, 'acting_as_landlord') and request.acting_as_landlord:
                    landlord = request.acting_as_landlord
                else:
                    return Response(
                        {"status": "error", "message": "Agent must specify which landlord they're acting as"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            elif user.groups.filter(name="admin").exists():
                return Response(
                    {"status": "error", "message": "Admin access not currently supported for lease reports"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                return Response(
                    {"status": "error", "message": "Only landlords and agents can access lease reports"},
                    status=status.HTTP_403_FORBIDDEN,
                )
                
            # Get all leases for this landlord
            landlord_leases = Lease.objects.filter(property_obj__land_lord=landlord)
            
            # Lease statistics
            lease_stats = landlord_leases.aggregate(
                total=Count("id"),
                active=Count(Case(When(status="active", then=1), output_field=IntegerField())),
                pending=Count(Case(When(status="pending", then=1), output_field=IntegerField())),
                completed=Count(Case(When(status="completed", then=1), output_field=IntegerField())),
                terminated=Count(Case(When(status="terminated", then=1), output_field=IntegerField())),
                rejected=Count(Case(When(status="rejected", then=1), output_field=IntegerField())),
                tenant_closed=Count(Case(When(status="tenant_closed", then=1), output_field=IntegerField())),
                landlord_closed=Count(Case(When(status="landlord_closed", then=1), output_field=IntegerField()))
            )
            
            # For each active lease, get the monthly installment amount
            active_leases = landlord_leases.filter(status="active")
            total_rent_value = Decimal("0.00")
            
            # Get total from first installment of each active lease
            for lease in active_leases:
                first_installment = lease.installments.first()
                if first_installment:
                    total_rent_value += first_installment.amount
            
            # Calculate installments and payment statistics
            installments = Installment.objects.filter(lease__in=landlord_leases)
            installment_stats = installments.aggregate(
                total=Count("id"),
                paid=Count(Case(When(status="paid", then=1), output_field=IntegerField())),
                pending=Count(Case(When(status="pending", then=1), output_field=IntegerField())),
                overdue=Count(Case(When(status="overdue", then=1), output_field=IntegerField()))
            )
            
            # Calculate payment amounts - rent is tracked through installment status, not Payment model
            paid_amount = installments.filter(status="paid").aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0.00")
            
            pending_amount = installments.filter(status="pending").aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0.00")
            
            overdue_amount = installments.filter(status="overdue").aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0.00")
            
            # Create CSV response
            response = HttpResponse(content_type="text/csv")
            current_date = timezone.now()
            month_year = current_date.strftime("%B_%Y")
            landlord_name = landlord.get_full_name() or landlord.username
            response["Content-Disposition"] = f'attachment; filename="Landlord_Lease_Report_{landlord_name}_{month_year}.csv"'
            
            writer = csv.writer(response)
            
            # Write CSV content
            writer.writerow([f'Landlord Lease Report - {current_date.strftime("%B %Y")}'])
            writer.writerow(["Landlord:", landlord_name])
            writer.writerow(["Generated on:", current_date.strftime("%Y-%m-%d %H:%M:%S")])
            writer.writerow([])
            
            writer.writerow(["=== LEASE SUMMARY ==="])
            writer.writerow(["Total Properties:", Property.objects.filter(land_lord=landlord).count()])
            writer.writerow(["Total Leases:", lease_stats["total"]])
            writer.writerow(["Active Leases:", lease_stats["active"]])
            writer.writerow(["Pending Leases:", lease_stats["pending"]])
            writer.writerow(["Completed Leases:", lease_stats["completed"]])
            writer.writerow(["Terminated Leases:", lease_stats["terminated"]])
            writer.writerow(["Total Monthly Rent Value:", f"${total_rent_value:.2f}"])
            writer.writerow([])
            
            writer.writerow(["=== PAYMENT SUMMARY ==="])
            writer.writerow(["Total Installments:", installment_stats["total"]])
            writer.writerow(["Paid Installments:", installment_stats["paid"]])
            writer.writerow(["Pending Installments:", installment_stats["pending"]])
            writer.writerow(["Overdue Installments:", installment_stats["overdue"]])
            writer.writerow(["Total Paid Amount:", f"${paid_amount:.2f}"])
            writer.writerow(["Pending Amount:", f"${pending_amount:.2f}"])
            writer.writerow(["Overdue Amount:", f"${overdue_amount:.2f}"])
            writer.writerow([])
            
            # Monthly revenue for last 6 months
            writer.writerow(["=== MONTHLY REVENUE (Last 6 Months) ==="])
            writer.writerow(["Month", "Revenue"])
            for i in range(5, -1, -1):
                month_start = (timezone.now().replace(day=1) - timedelta(days=32 * i)).replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                month_revenue = Payment.objects.filter(
                    installment__lease__in=landlord_leases,
                    status="success", 
                    created_at__gte=month_start, 
                    created_at__lte=month_end
                ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
                
                writer.writerow([month_start.strftime("%Y-%m"), f"${month_revenue:.2f}"])
            writer.writerow([])
            
            # List of properties and active leases
            writer.writerow(["=== PROPERTY AND LEASE DETAILS ==="])
            writer.writerow(["Property ID", "Property Name", "Address", "Lease Status", "Tenant", "Monthly Rent", "Start Date", "End Date"])
            
            for lease in landlord_leases:
                # Get monthly rent amount from first installment
                first_installment = lease.installments.first()
                monthly_rent = first_installment.amount if first_installment else Decimal("0.00")
                
                writer.writerow([
                    lease.property_obj.id,
                    lease.property_obj.name,
                    lease.property_obj.address,
                    lease.status,
                    lease.tenant.username,
                    f"${monthly_rent:.2f}",
                    lease.start_date.strftime("%Y-%m-%d") if lease.start_date else "N/A",
                    lease.end_date.strftime("%Y-%m-%d") if lease.end_date else "N/A",
                ])
            writer.writerow([])
            
            # Recent rent payments (from paid installments)
            writer.writerow(["=== RECENT RENT PAYMENTS ==="])
            writer.writerow(["Paid Date", "Property", "Tenant", "Amount", "Status"])
            recent_rent_payments = installments.filter(
                status="paid"
            ).order_by("-paid_date")[:20]
            
            for installment in recent_rent_payments:
                writer.writerow([
                    installment.paid_date.strftime("%Y-%m-%d") if installment.paid_date else "N/A",
                    installment.lease.property_obj.name,
                    installment.lease.tenant.username,
                    f"${installment.amount:.2f}",
                    "Paid",
                ])
            
            # Recent utility payments
            writer.writerow([])
            writer.writerow(["=== RECENT UTILITY PAYMENTS ==="])
            writer.writerow(["Date", "Property", "Tenant", "Amount", "Status"])
            recent_utility_payments = Payment.objects.filter(
                utility__lease__in=landlord_leases
            ).order_by("-created_at")[:20]
            
            for payment in recent_utility_payments:
                writer.writerow([
                    payment.created_at.strftime("%Y-%m-%d"),
                    payment.utility.lease.property_obj.name,
                    payment.utility.lease.tenant.username,
                    f"${payment.amount:.2f}",
                    payment.status,
                ])
            
            return response
            
        except Exception as e:
            # Return an error response compatible with DRF
            return Response(
                {"status": "error", "message": f"Failed to generate lease report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
