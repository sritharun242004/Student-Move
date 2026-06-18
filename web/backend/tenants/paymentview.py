from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework import generics
import stripe
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Payment, Utility, Lease
from .serializers import PaymentSerializer, PaymentStatementSerializer


# Initialize Stripe with your API key
stripe.api_key = settings.STRIPE_SECRET_KEY


class InitPaymentView(APIView):
    
    queryset = Utility.objects.all()
    serializer_class = PaymentSerializer
    """
    Initialize a payment for a utility
    """

    def post(self, request, *args, **kwargs):
        data = request.data
        utility_id = data.get("utilityId")
        tenant = request.user

        # Get the utility
        utility = get_object_or_404(Utility, id=utility_id)

        if utility.lease.tenant != tenant:
            return Response({"error": "You do not have permission to pay this utility"}, status=status.HTTP_403_FORBIDDEN)

        # Check if utility is not already paid
        if utility.status == "paid":
            return Response({"error": "Utility already paid"}, status=status.HTTP_400_BAD_REQUEST)

        # Create a payment intent with Stripe
        try:
            # Convert decimal amount to cents
            amount_in_cents = int(utility.amount * 100)

            # Create the PaymentIntent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency="usd",  # Change to your currency
                metadata={
                    "utility_id": str(utility.id),
                    "property_name": utility.lease.property_obj.name,
                    "tenant": utility.lease.tenant.username,
                },
                description=f"Payment for {utility.lease.property_obj.name} (Utility)",
            )

            # Create the Payment object in your database
            payment = Payment.objects.create(
                utility=utility,  # Note: This assumes Payment.utility can point to Utility
                amount=utility.amount,
                stripe_payment_intent_id=payment_intent.id,
            )

            # Return the client_secret to the frontend
            return Response(
                {
                    "clientSecret": payment_intent.client_secret,
                    "payment_id": str(payment.id),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print(e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


@csrf_exempt 
@api_view(["POST"])
def stripe_webhook(request):
    """
    Webhook endpoint that Stripe will call when payment events occur
    """
    payload = request.body
    # The signature header can vary slightly based on server config (e.g., HTTP_STRIPE_SIGNATURE)
    sig_header = request.headers.get("stripe-signature")

    try:
        # Verify the event is from Stripe
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

        # Handle the event
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            handle_payment_success(payment_intent)
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            handle_payment_failure(payment_intent)

        return Response({"status": "success"}, status=status.HTTP_200_OK)

    except ValueError as e:
        # Invalid payload
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def handle_payment_success(payment_intent):
    """Update payment record when payment succeeds"""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=payment_intent["id"])
        payment.status = "success"
        payment.stripe_charge_id = payment_intent.get("latest_charge")
        payment.save()  # This will also mark the utility as paid due to your save method

        return payment
    except Payment.DoesNotExist:
        # Log this error - payment intent ID not found in your database
        pass


def handle_payment_failure(payment_intent):
    """Update payment record when payment fails"""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=payment_intent["id"])
        payment.status = "failed"
        payment.save()
    except Payment.DoesNotExist:
        # Log this error - payment intent ID not found in your database
        pass

class UpdateUtilityPaymentStatus(APIView):
    """
    PUT endpoint to update payment status for a utility payment,
    ensuring payment is linked with the given utility.
    """

    def put(self, request, *args, **kwargs):
        data = request.data
        payment_id = data.get("paymentId")
        utility_id = data.get("utilityId")

        # Get the utility
        utility = get_object_or_404(Utility, id=utility_id)
        if utility.lease.tenant != request.user:
            return Response({"error": "You do not have permission to update this payment"}, status=status.HTTP_403_FORBIDDEN)

        # Get the payment and verify it's linked to the given utility
        payment = get_object_or_404(Payment, stripe_payment_intent_id=payment_id, utility=utility)

        # Update the payment status
        new_status = data.get("status")
        payment.status = new_status
        payment.save()

        return Response({"status": "success"}, status=status.HTTP_200_OK)

class PayementListView(generics.ListAPIView):
    serializer_class = PaymentStatementSerializer
    queryset = Payment.objects.all()

    def filter_queryset(self, queryset):
        # if user in landlord, send payments filter by , 
        if self.request.user.is_landlord:
            queryset = queryset.filter(utility__lease__property_obj__landlord=self.request.user)
            return queryset
        
        return super().filter_queryset(queryset)

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    


class VerifyPaymentView(APIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    """
    An endpoint to proactively verify a payment's status with Stripe
    after a successful client-side confirmation.
    """
    def put(self, request, *args, **kwargs):
        data = request.data
        payment_intent_id = data.get("paymentIntentId")

        if not payment_intent_id:
            return Response({"error": "PaymentIntent ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Retrieve the PaymentIntent object from Stripe's API
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            # Check if the status is 'succeeded'
            if payment_intent.status == 'succeeded':
                payment = handle_payment_success(payment_intent)
                
                
                data = {
                    "completedAt": payment.updated_at,
                    "amount": payment.amount,
                    "status": payment.status,
                    "receiptNumber": payment.stripe_charge_id,
                    "paymentMethod": payment_intent.payment_method_types[0] if payment_intent.payment_method_types else "N/A",
                    "description": payment_intent.description,
                    "property": payment.utility.lease.property_obj.name if payment.utility else "N/A",
                }
                
                return Response({"status": "success", "message": "Payment verified and recorded.","data":data}, status=status.HTTP_200_OK)
            else:
                # The payment was not successful, despite what the client thought.
                return Response(
                    {"status": "failed", "message": f"Payment status is '{payment_intent.status}'."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except stripe.error.InvalidRequestError as e:
            # This happens if the PaymentIntent ID is invalid
            return Response({"error": "Invalid PaymentIntent ID."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Handle other potential errors (e.g., network issues)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class ManualPaymentView(generics.UpdateAPIView):
    """
    An endpoint to manually record a payment made outside of Stripe
    (e.g., cash or check payments) with receipt file.
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Payment.objects.all()
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request, *args, **kwargs):
        request.data["status"] = "success"
        response = super().put(request, *args, **kwargs, partial=True)
        payment = self.get_object()
        utility_obj = payment.utility
        utility_obj.status = 'pending_verification'
        utility_obj.save()

        return Response({
            "status": "success", 
            "message": "Manual payment recorded and pending verification.",
        }, status=status.HTTP_200_OK)

        


class VerifyManualPaymentView(generics.UpdateAPIView):
    """
    An endpoint to verify and approve manual payments made outside of Stripe
    (e.g., cash or check payments).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer
    queryset = Payment.objects.all()


    def put(self, request, *args, **kwargs):
        payment= self.get_object()
        payment.status = 'success'
        payment.save()

        if payment.utility:
            payment.utility.status = 'paid'
            payment.utility.save()
        
        if payment.installement:
            payment.installement.status = 'paid'
            payment.installement.save()
        
        return Response({"status": "success", "message": "Manual payment verified and recorded."}, status=status.HTTP_200_OK)


class PaymentsByLeaseView(generics.ListAPIView):
    """
    Get all payments for a specific lease.
    - Admins can access all payments
    - Landlords can access payments for their leases
    - Agents can access payments when acting as landlord
    - Tenants can access payments for their own leases
    """
    serializer_class = PaymentStatementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        lease_id = self.kwargs.get("lease_id")
        user = self.request.user
        
        # Get the lease first
        try:
            lease = Lease.objects.get(id=lease_id)
        except Lease.DoesNotExist:
            return Payment.objects.none()
        
        # Check permissions
        has_permission = False
        
        if user.groups.filter(name="admin").exists():
            has_permission = True
        elif user.groups.filter(name="landlord").exists():
            if lease.property_obj.land_lord == user:
                has_permission = True
        elif user.groups.filter(name="agent").exists():
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                if lease.property_obj.land_lord == self.request.acting_as_landlord:
                    has_permission = True
        elif user.groups.filter(name="tenant").exists():
            if lease.tenant == user:
                has_permission = True
        
        if not has_permission:
            return Payment.objects.none()
        
        # Get payments for both utilities and installments related to this lease
        payments = Payment.objects.filter(
            utility__lease_id=lease_id
        ) | Payment.objects.filter(
            installement__lease_id=lease_id
        )
        
        return payments.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "status": "success",
            "message": "Payments retrieved successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)


class RentPaymentHistoryView(generics.ListAPIView):
    """
    Get rent payment history (installment payments only) for a specific lease.
    Excludes utility payments.
    """
    serializer_class = PaymentStatementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        lease_id = self.kwargs.get("lease_id")
        user = self.request.user
        
        # Get the lease first
        try:
            lease = Lease.objects.get(id=lease_id)
        except Lease.DoesNotExist:
            return Payment.objects.none()
        
        # Check permissions
        has_permission = False
        
        if user.groups.filter(name="admin").exists():
            has_permission = True
        elif user.groups.filter(name="landlord").exists():
            if lease.property_obj.land_lord == user:
                has_permission = True
        elif user.groups.filter(name="agent").exists():
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                if lease.property_obj.land_lord == self.request.acting_as_landlord:
                    has_permission = True
        elif user.groups.filter(name="tenant").exists():
            if lease.tenant == user:
                has_permission = True
        
        if not has_permission:
            return Payment.objects.none()
        
        # Get ONLY rent payments (installment payments), excluding utility payments
        payments = Payment.objects.filter(
            installement__lease_id=lease_id,
            installement__isnull=False
        ).distinct()
        
        return payments.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "status": "success",
            "message": "Rent payment history retrieved successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

