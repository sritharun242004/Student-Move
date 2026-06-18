from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from .models import Otp, GuarantorShareToken
from django.contrib.auth.models import User  # Assuming you have a User model


class GuarantorTokenAuthentication(BaseAuthentication):
    """
    Custom authentication class for handling shared guarantor token access.
    """

    def authenticate(self, request):
        # Extract token from URL parameter or Authorization header
        token = request.GET.get('token') or request.headers.get('X-Guarantor-Token')
        
        if not token:
            return None  # No token provided

        try:
            share_token = GuarantorShareToken.objects.get(token=token)
            
            if not share_token.is_valid:
                raise AuthenticationFailed("Token is expired or inactive")
            
            # Update accessed_at timestamp
            from django.utils import timezone
            share_token.accessed_at = timezone.now()
            share_token.save(update_fields=['accessed_at'])
            
            # Set application context for the request
            request.application = share_token.application
            request.is_shared_access = True
            
            # Return None for user (no user authentication needed) and the token for auth context
            return (None, share_token)
            
        except GuarantorShareToken.DoesNotExist:
            raise AuthenticationFailed("Invalid or expired token")

    def authenticate_header(self, request):
        return 'Bearer'


class OtpAuthenticator(BaseAuthentication):
    """
    Custom authentication class for handling OTP-based access.
    """

    def authenticate(self, request):
        # Extract token from the request headers
        token = request.headers.get("Authorization")
        print(f"\n=== OtpAuthenticator Debug ===")
        print(f"Authorization header: {token}")
        
        if not token:
            print("No token provided, returning None")
            return None  # No token provided

        # Remove 'Bearer ' prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
            print(f"Removed Bearer prefix, token: {token[:50]}...")

        # Validate the token
        try:
            access_token = AccessToken(token)
            print(f"AccessToken created successfully")
            print(f"Token payload: {access_token.payload}")
            
            # Check if user_id is in the token
            user_id = access_token.get("user_id")
            print(f"User ID from token: {user_id}")
            
            if user_id is not None:
                # User-based authentication
                try:
                    user = User.objects.get(id=user_id)
                    print(f"Found user: {user.email}")
                    print("=== OtpAuthenticator Success ===\n")
                    return (user, None)  # Return user and None for the auth context
                except User.DoesNotExist:
                    print("User not found in database")
                    raise AuthenticationFailed("User not found")

            # Check if otp_id is in the token
            otp_id = access_token.get("otp_id")
            print(f"OTP ID from token: {otp_id}")
            
            if otp_id is not None:
                # OTP-based authentication
                try:
                    otp_instance = Otp.objects.get(id=otp_id)

                    request.application = otp_instance.form.id  # Assuming 'form' is an attribute of Otp
                    request.role = otp_instance.role
                    
                    print(f"Found OTP instance: {otp_instance}")
                    print("=== OtpAuthenticator OTP Success ===\n")
                    # Return None for the user and the OTP instance for auth context
                    return (None, otp_instance)  # Return None user and otp_instance
                    
                except Otp.DoesNotExist:
                    print("OTP instance not found")
                    raise AuthenticationFailed("OTP instance not found")

            print("Token contains neither user_id nor otp_id")
            raise AuthenticationFailed("Token must contain either 'user_id' or 'otp_id'")

        except Exception as e:
            print(f"Exception in OtpAuthenticator: {str(e)}")
            print("=== OtpAuthenticator Failed ===\n")
            raise AuthenticationFailed(f"Token validation failed: {str(e)}")

    def authenticate_header(self, request):
        """
        Implement this method to provide the required authentication headers.
        """
        return 'Bearer'  # or any other value that you want

