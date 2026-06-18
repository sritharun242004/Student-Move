from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Case, When, IntegerField, Q
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta

from .models import Lease, MaintenanceRequest, Installment, Payment
from properties.models import Property


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def landlord_dashboard_stats(request):
    """
    Get landlord-specific dashboard statistics including property counts, 
    lease analytics, maintenance requests, and financial data.
    Works for both landlords and agents acting as landlords.
    """
    try:
        user = request.user
        landlord = None
        
        # Debug logging
        print(f"Debug: User role: {[group.name for group in user.groups.all()]}")
        print(f"Debug: Has acting_as_landlord: {hasattr(request, 'acting_as_landlord')}")
        if hasattr(request, 'acting_as_landlord'):
            print(f"Debug: Acting as landlord: {request.acting_as_landlord}")
        print(f"Debug: X-Acting-As-Landlord header: {request.headers.get('X-Acting-As-Landlord')}")
        
        # Determine the effective landlord
        if user.groups.filter(name="landlord").exists():
            landlord = user
            print(f"Debug: Using user as landlord: {landlord.id}")
        elif user.groups.filter(name="agent").exists():
            # Agent acting as landlord
            if hasattr(request, 'acting_as_landlord') and request.acting_as_landlord:
                landlord = request.acting_as_landlord
                print(f"Debug: Agent acting as landlord: {landlord.id}")
            else:
                print("Debug: Agent but no landlord context")
                return Response(
                    {"status": "error", "message": "Agent must specify which landlord they're acting as"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif user.groups.filter(name="admin").exists():
            # Admin can view all data - for now return error asking to specify landlord
            return Response(
                {"status": "error", "message": "Admin must specify which landlord's dashboard to view"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            return Response(
                {"status": "error", "message": "Only landlords and agents can access landlord dashboard"},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        # Get landlord's properties
        properties = Property.objects.filter(land_lord=landlord)
        total_properties = properties.count()
        approved_properties = properties.filter(status="approved").count()
        pending_properties = properties.filter(status="pending").count()
        
        # Get landlord's leases
        leases = Lease.objects.filter(property_obj__land_lord=landlord)
        
        # Lease statistics
        lease_stats = leases.aggregate(
            total=Count("id"),
            active=Count(Case(When(status="active", then=1), output_field=IntegerField())),
            pending=Count(Case(When(status="pending", then=1), output_field=IntegerField())),
            completed=Count(Case(When(status="completed", then=1), output_field=IntegerField())),
            terminated=Count(Case(When(status="terminated", then=1), output_field=IntegerField())),
            rejected=Count(Case(When(status="rejected", then=1), output_field=IntegerField())),
            tenant_closed=Count(Case(When(status="tenant_closed", then=1), output_field=IntegerField())),
            landlord_closed=Count(Case(When(status="landlord_closed", then=1), output_field=IntegerField()))
        )
        
        # Calculate occupancy rate
        occupied_properties = leases.filter(status="active").values('property_obj').distinct().count()
        occupancy_rate = (occupied_properties / total_properties * 100) if total_properties > 0 else 0
        
        # Calculate monthly revenue from active leases
        active_leases = leases.filter(status="active")
        monthly_revenue = Decimal("0.00")
        
        for lease in active_leases:
            # Get the monthly rent amount from installments
            first_installment = lease.installments.first()
            if first_installment:
                if lease.installment_type == "weekly":
                    # Convert weekly to monthly (4 weeks per month)
                    monthly_amount = first_installment.amount * 4
                else:
                    monthly_amount = first_installment.amount
                monthly_revenue += monthly_amount
        
        # Maintenance request statistics for landlord's properties
        maintenance_requests = MaintenanceRequest.objects.filter(lease__property_obj__land_lord=landlord)
        maintenance_stats = maintenance_requests.aggregate(
            total=Count("id"),
            pending=Count(Case(When(status="pending", then=1), output_field=IntegerField())),
            in_progress=Count(Case(When(status="in_progress", then=1), output_field=IntegerField())),
            completed=Count(Case(When(status="completed", then=1), output_field=IntegerField())),
            confirmed=Count(Case(When(status="confirmed", then=1), output_field=IntegerField())),
            high_priority=Count(Case(When(priority="high", then=1), output_field=IntegerField())),
            medium_priority=Count(Case(When(priority="medium", then=1), output_field=IntegerField())),
            low_priority=Count(Case(When(priority="low", then=1), output_field=IntegerField())),
        )
        
        # Active maintenance requests (pending + in_progress)
        active_maintenance_requests = maintenance_stats["pending"] + maintenance_stats["in_progress"]
        
        # Financial analytics for landlord's leases
        installments = Installment.objects.filter(lease__property_obj__land_lord=landlord)
        
        # Total pending payments
        pending_payments = installments.filter(status="pending").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")
        
        # Total overdue payments
        overdue_payments = installments.filter(status="overdue").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")
        
        # Successful payments for this landlord's properties (utility payments only)
        successful_payments = Payment.objects.filter(
            utility__lease__property_obj__land_lord=landlord,
            status="success"
        )
        
        total_collected = successful_payments.aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")
        
        # Current month revenue from utility payments
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_revenue = successful_payments.filter(
            created_at__gte=current_month_start
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        
        # Add rent revenue from paid installments
        paid_installments = installments.filter(status="paid")
        total_rent_collected = paid_installments.aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")
        
        current_month_rent = paid_installments.filter(
            paid_date__gte=current_month_start
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        
        # Combine utility and rent revenue
        total_collected += total_rent_collected
        current_month_revenue += current_month_rent
        
        # Ending soon leases (within next 60 days)
        # Since end_date is a property, we need to calculate this manually
        sixty_days_from_now = timezone.now().date() + timedelta(days=60)
        ending_soon_leases = 0
        for lease in active_leases:
            # Calculate end_date: start_date + lease_months
            end_date = lease.start_date + relativedelta(months=lease.lease_months)
            if end_date <= sixty_days_from_now:
                ending_soon_leases += 1
        
        # Recent activity for landlord's properties (last 10 activities)
        recent_activities = []
        
        # Recent utility payments
        recent_payments = successful_payments.order_by("-created_at")[:5]
        for payment in recent_payments:
            recent_activities.append({
                "type": "payment",
                "title": f"Utility payment received - £{payment.amount}",
                "description": f"Utility payment from {payment.utility.lease.tenant.get_full_name() or payment.utility.lease.tenant.username}",
                "property": payment.utility.lease.property_obj.address.split(',')[0],
                "time": payment.created_at,
                "amount": float(payment.amount),
            })
        
        # Recent rent payments (from paid installments)
        recent_rent_payments = paid_installments.order_by("-paid_date")[:5]
        for installment in recent_rent_payments:
            if installment.paid_date:
                recent_activities.append({
                    "type": "payment",
                    "title": f"Rent payment received - £{installment.amount}",
                    "description": f"Rent payment from {installment.lease.tenant.get_full_name() or installment.lease.tenant.username}",
                    "property": installment.lease.property_obj.address.split(',')[0],
                    "time": timezone.datetime.combine(installment.paid_date, timezone.datetime.min.time()).replace(tzinfo=timezone.get_current_timezone()),
                    "amount": float(installment.amount),
                })
        
        # Recent maintenance requests
        recent_maintenance = maintenance_requests.order_by("-created_at")[:5]
        for request in recent_maintenance:
            recent_activities.append({
                "type": "maintenance",
                "title": f"Maintenance request - {request.priority} priority",
                "description": request.issue_title,
                "property": request.lease.property_obj.address.split(',')[0],
                "time": request.created_at,
                "priority": request.priority,
                "status": request.status,
            })
        
        # Sort activities by time and limit to 10
        recent_activities.sort(key=lambda x: x["time"], reverse=True)
        recent_activities = recent_activities[:10]
        
        # Format timestamps for frontend
        for activity in recent_activities:
            activity["time"] = activity["time"].isoformat()
        
        # Monthly revenue trend (last 6 months)
        revenue_trend = []
        for i in range(5, -1, -1):
            month_start = (timezone.now().replace(day=1) - timedelta(days=32 * i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            # Utility payments for the month
            month_utility_revenue = successful_payments.filter(
                created_at__gte=month_start, 
                created_at__lte=month_end
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
            
            # Rent payments for the month
            month_rent_revenue = paid_installments.filter(
                paid_date__gte=month_start.date(), 
                paid_date__lte=month_end.date()
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
            
            total_month_revenue = month_utility_revenue + month_rent_revenue
            
            revenue_trend.append({
                "month": month_start.strftime("%Y-%m"),
                "revenue": float(total_month_revenue),
            })
        
        stats = {
            # Property statistics
            "properties": {
                "total": total_properties,
                "approved": approved_properties,
                "pending": pending_properties,
                "occupancy_rate": round(occupancy_rate, 1),
                "occupied": occupied_properties,
            },
            
            # Lease statistics
            "leases": {
                "total": lease_stats["total"],
                "active": lease_stats["active"],
                "pending": lease_stats["pending"],
                "completed": lease_stats["completed"],
                "terminated": lease_stats["terminated"],
                "rejected": lease_stats["rejected"],
                "tenant_closed": lease_stats["tenant_closed"],
                "landlord_closed": lease_stats["landlord_closed"],
                "ending_soon": ending_soon_leases,
            },
            
            # Financial data
            "financial": {
                "monthly_revenue": float(monthly_revenue),
                "current_month_revenue": float(current_month_revenue),
                "total_collected": float(total_collected),
                "pending_payments": float(pending_payments),
                "overdue_payments": float(overdue_payments),
                "revenue_trend": revenue_trend,
            },
            
            # Maintenance statistics
            "maintenance": {
                "total": maintenance_stats["total"],
                "active": active_maintenance_requests,
                "pending": maintenance_stats["pending"],
                "in_progress": maintenance_stats["in_progress"],
                "completed": maintenance_stats["completed"],
                "confirmed": maintenance_stats["confirmed"],
                "high_priority": maintenance_stats["high_priority"],
                "medium_priority": maintenance_stats["medium_priority"],
                "low_priority": maintenance_stats["low_priority"],
            },
            
            # Recent activity
            "recent_activities": recent_activities,
            
            # Metadata
            "landlord": {
                "id": landlord.id,
                "name": landlord.get_full_name() or landlord.username,
                "is_agent_view": user.groups.filter(name="agent").exists(),
            }
        }
        
        response = {
            "status": "success",
            "message": "Landlord dashboard statistics retrieved successfully",
            "data": stats,
        }
        
        return Response(response, status=status.HTTP_200_OK)
        
    except Exception as e:
        response = {
            "status": "error",
            "message": f"Error retrieving landlord dashboard statistics: {str(e)}",
        }
        return Response(response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
