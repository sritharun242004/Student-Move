from datetime import datetime
from django.core.mail import send_mail
from django.conf import settings
import threading


class EmailNotifier:
    """
    A class-based email notification system using Resend.
    """

    @classmethod
    def notify_user_registration(cls, user_email, first_name):
        """
        Send a welcome email to newly registered users.
        """
        subject = "Welcome to Student Moves!"
        message = f"""Dear {first_name},

Welcome to Student Moves! We're excited to have you join our platform.

Your account has been successfully created and you can now access all our features.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
Student Moves Team"""
        
        cls.send_email(subject, message, user_email)

    @staticmethod
    def _send_email_threaded(subject, message, recipient_email):
        """
        Internal method to send an email in a separate thread using Resend.
        """
        send_mail(
            subject,
            message,
            settings.FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
        )

    @staticmethod
    def send_email(subject, message, recipient_email):
        """
        Send an email using Resend in a separate thread.
        """
        # Append date, time, and system-generated note to the message
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        footer = f"\n\n Mail generated at: {timestamp}\nPlease do not reply to this system-generated mail."
        full_message = f"{message}{footer}"

        # Start a new thread to send the email
        threading.Thread(
            target=EmailNotifier._send_email_threaded,
            args=(subject, full_message, recipient_email),
        ).start()

    @classmethod
    def notify_admin_new_property(cls, user, property):
        """
        Notify the admin about a new property created by a user.
        """
        subject = "New Property Created"
        message = f"A new property has been created by {user}.\n\nProperty Details:\nName: {property.name}\nPrice: {property.price}\nDescription: {property.description}"
        cls.send_email(subject, message, settings.ADMIN_EMAIL)

    @classmethod
    def notify_landlord_new_inquiry(cls, landlord_email):
        """
        Notify the landlord about a new inquiry.
        """
        subject = "New Inquiry Arrived"
        message = "A new inquiry has been submitted for your property."
        cls.send_email(subject, message, landlord_email)

    @classmethod
    def notify_landlord_new_maintenance_request(cls, landlord_email):
        """
        Notify the landlord about a new maintenance request.
        """
        subject = "New Maintenance Request"
        message = "A new maintenance request has been submitted for your property."
        cls.send_email(subject, message, landlord_email)

    @classmethod
    def notify_landlord_new_lease_request(cls, landlord_email, username):
        """
        Notify the landlord about a new lease request.
        """
        subject = "New Lease Request"
        message = (
            "A new lease request has been submitted for your property. by {username}"
        )
        cls.send_email(subject, message, landlord_email)

    @classmethod
    def notify_tenant_new_inspection(cls, tenant_email):
        """
        Notify the tenant about a new inspection.
        """
        subject = "New Inspection Scheduled"
        message = "A new inspection has been scheduled for your property."
        cls.send_email(subject, message, tenant_email)

    @classmethod
    def notify_landlord_property_approved(cls, landlord_email, property_name):
        """
        Notify the landlord that their property has been approved.
        """
        subject = "Property Approved"
        message = "Your property has been approved."
        cls.send_email(subject, message, landlord_email)

    @classmethod
    def notify_admin_property_flagged(cls, landlord_email, property_name):
        """
        Notify the admin that a property has been flagged.
        """
        subject = "Property Flagged"
        message = (
            f"The property '{property_name}' has been flagged by admin.\n\n"
            f"Landlord Email: {landlord_email}\n"
            "Please review the property for further action."
        )
        cls.send_email(subject, message, settings.ADMIN_EMAIL)

    @classmethod
    def notify_landlord_maintenance_request_confirmed(
        cls, landlord_email, maintenance_request_id
    ):
        """
        Notify the landlord that a maintenance request has been confirmed by the tenant.
        """
        subject = "Maintenance Request Confirmed"
        message = f"The maintenance request with ID {maintenance_request_id} has been confirmed by the tenant."
        cls.send_email(subject, message, landlord_email)


    @classmethod
    def password_reset_otp(cls, email, otp):
        """
        Notify the user about the password reset OTP.
        """
        subject = "Password Reset OTP"
        message = f"Your password reset OTP is: {otp}\nPlease use this OTP to reset your password."
        cls.send_email(subject, message, email)

    @classmethod
    def send_notification_email(cls, to_email, subject, notification_type, context):
        """
        Send notification emails based on notification type with context.
        """
        if notification_type == "removal_warning":
            message = f"""Dear {context.get('user_name', 'User')},

Your landlord account has been scheduled for removal from the Student Moves platform.

Reason: Administrative action required
Property Count: {context.get('property_count', 0)} properties will be affected

Important Information:
• Your account will be deactivated immediately
• All your properties will be hidden from public view
• You have 7 days to resolve any issues or contact support
• After 7 days, your account and properties will be permanently deleted

If you believe this action was taken in error, please contact our support team immediately at support@studentmoves.com.

Best regards,
Student Moves Admin Team"""

        elif notification_type == "account_deleted":
            message = f"""Dear {context.get('user_name', 'User')},

Your landlord account has been permanently removed from the Student Moves platform.

This action was taken due to administrative requirements. All associated data has been permanently deleted.

If you believe this action was taken in error, please contact our support team at support@studentmoves.com.

Best regards,
Student Moves Admin Team"""

        elif notification_type == "account_restored":
            message = f"""Dear {context.get('user_name', 'User')},

Good news! Your landlord account has been successfully restored on the Student Moves platform.

Your account is now active and you can:
• Access all platform features
• Manage your properties
• Receive new tenant inquiries
• List new properties

Your properties are now visible to potential tenants again.

If you have any questions, please contact our support team at support@studentmoves.com.

Welcome back!
Student Moves Admin Team"""

        else:
            # Generic notification
            message = context.get('message', 'You have received a new notification.')

        cls.send_email(subject, message, to_email)
