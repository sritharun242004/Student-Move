from rest_framework.views import exception_handler


def extract_all_error_messages(error_messages):
    """
    Extract all error messages from the error messages dictionary

    Example:-

    error_messages_1 = {
        "user": {
            "password": [
                "This field is required."
            ]
        },
        "userprofile": {
            "username": [
                "Username already exists"
                ]
        }
    }

    error_messages_2 = {
        "username": [
            "username is required."
        ]
    }

    print(extract_all_error_messages(error_messages_1))  # Outputs: ["password field is required.", "Username already exists"]
    print(extract_all_error_messages(error_messages_2))  # Outputs: ["username is required."]

    """
    error_list = []

    def helper(error_messages):
        for key, value in error_messages.items():
            if isinstance(value, dict):
                helper(value)

            elif isinstance(value, list):
                for message in value:
                    if isinstance(message, str):
                        if message.startswith("This field"):
                            message = message.replace("This", key)

                        error_list.append(message)

            elif isinstance(value, str):
                error_list.append(value)

    helper(error_messages)
    return error_list


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        formatted_errors = {
            "status": "fail",
            "message": extract_all_error_messages(response.data),
        }
        response.data = formatted_errors

    return response
