"""
Custom media file serving with CORS support for development
"""
import os
import mimetypes
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.views.decorators.cache import cache_control


def add_cors_headers(response):
    """Add CORS headers to response"""
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization, X-Requested-With'
    response['Access-Control-Max-Age'] = '86400'
    return response


@csrf_exempt
def serve_media_file(request, path):
    """
    Serve media files with proper CORS headers for development
    """
    # Handle OPTIONS preflight requests
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    # Security check - only serve files from MEDIA_ROOT
    media_root = settings.MEDIA_ROOT
    file_path = os.path.join(media_root, path)
    
    # Prevent directory traversal attacks
    try:
        # Resolve both paths to absolute paths
        media_root_abs = os.path.abspath(media_root)
        file_path_abs = os.path.abspath(file_path)
        
        # Check if file path is within media root
        if not file_path_abs.startswith(media_root_abs):
            raise Http404("File not found")
    except (OSError, ValueError):
        raise Http404("File not found")
    
    if not os.path.exists(file_path_abs) or not os.path.isfile(file_path_abs):
        raise Http404("File not found")
    
    # Determine content type based on file extension
    content_type, _ = mimetypes.guess_type(file_path_abs)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # Read and serve the file
    try:
        with open(file_path_abs, 'rb') as f:
            response = HttpResponse(f.read(), content_type=content_type)
            
            # Add CORS headers
            response = add_cors_headers(response)
            
            # Add cache headers for better performance
            response['Cache-Control'] = 'public, max-age=3600'
            
            return response
    except IOError:
        raise Http404("File not found")
