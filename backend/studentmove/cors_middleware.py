"""
Custom CORS middleware to ensure all responses have CORS headers
"""

class CustomCorsMiddleware:
    """
    Middleware to add CORS headers to all responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add CORS headers to all responses if they don't already exist
        if not response.get('Access-Control-Allow-Origin'):
            response['Access-Control-Allow-Origin'] = '*'
        
        if request.method == 'OPTIONS':
            response['Access-Control-Allow-Methods'] = 'DELETE, GET, OPTIONS, PATCH, POST, PUT'
            response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with, x-acting-as-landlord'
            response['Access-Control-Max-Age'] = '86400'
        
        return response
