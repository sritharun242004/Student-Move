from datetime import datetime
from django.core.mail import send_mail
from django.conf import settings


def notify_admin_new_application(user):
    current_time = datetime.now().strftime("%Y-%m-%d")  # Get the current date and time
    message = (
        f"Dear Admin,\n\n"
        f"A new application has been submitted by {user}.\n"
        f"Submission Time: {current_time}.\n\n"
        f"Please review the application at your earliest convenience.\n\n"
        f"Best regards,\n"
        f"Your Application System"
    )

    send_mail(
        "New Application Form Submitted",
        message,
        settings.FROM_EMAIL,
        [settings.ADMIN_EMAIL],
        fail_silently=False,
    )

def notify_admin_new_guarantor_form():
    current_time = datetime.now().strftime("%Y-%m-%d")  # Get the current date and time
    message = (
        f"Dear Admin,\n\n"
        f"A new guarantor form has been submitted.\n"  # Fixed missing period
        f"Submission Time: {current_time}.\n\n"
        f"Please review the guarantor form at your earliest convenience.\n\n"
        f"Best regards,\n"
        f"Your Application System"
    )

    send_mail(
        "New Guarantor Form Submitted",
        message,
        settings.FROM_EMAIL,
        [settings.ADMIN_EMAIL],
        fail_silently=False,
    )
