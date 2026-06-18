from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import User, AnonymousUser
from users.models import AgentLandlordRelationship
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser


class AgentLandlordContextMiddleware(MiddlewareMixin):
    """
    Middleware to handle agent acting on behalf of landlord context.
    Checks for X-Acting-As-Landlord header and validates the relationship.
    """
    
    def process_request(self, request):
        # Initialize acting_as_landlord as None
        request.acting_as_landlord = None
        
        # Skip if this is not an API request
        if not request.path.startswith('/api/'):
            return None
        
        # Only process if we have the X-Acting-As-Landlord header
        landlord_id = request.headers.get('X-Acting-As-Landlord')
        if not landlord_id:
            print("Debug Middleware: No X-Acting-As-Landlord header found")
            return None
        
        print(f"Debug Middleware: X-Acting-As-Landlord header value: {landlord_id}")
        
        # Try to get the authenticated user
        authenticated_user = None
        
        # First check if user is already authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            authenticated_user = request.user
            print(f"Debug Middleware: User already authenticated: {authenticated_user.email}")
        else:
            # Try to authenticate using JWT
            try:
                jwt_auth = JWTAuthentication()
                auth_result = jwt_auth.authenticate(request)
                if auth_result:
                    authenticated_user, _ = auth_result
                    request.user = authenticated_user  # Set the user on the request
                    print(f"Debug Middleware: JWT authenticated user: {authenticated_user.email}")
                else:
                    print("Debug Middleware: No valid JWT token found")
                    return None
            except (InvalidToken, TokenError) as e:
                print(f"Debug Middleware: JWT authentication failed: {e}")
                return None
        
        # Check if the authenticated user is an agent
        if not authenticated_user or not authenticated_user.groups.filter(name="agent").exists():
            print("Debug Middleware: User is not an agent")
            return None
            
        try:
            landlord_id = int(landlord_id)
            print(f"Debug Middleware: Converted landlord_id to int: {landlord_id}")
            
            # Verify that the agent has an approved relationship with this landlord
            relationship = AgentLandlordRelationship.objects.filter(
                agent=authenticated_user,
                landlord_id=landlord_id,
                status='active'
            ).first()
            
            print(f"Debug Middleware: Found relationship: {relationship}")
            
            if relationship:
                request.acting_as_landlord = relationship.landlord
                print(f"Debug Middleware: Set acting_as_landlord to: {relationship.landlord}")
            else:
                print("Debug Middleware: No approved relationship found")
                # Let's also check what relationships exist for this agent
                all_relationships = AgentLandlordRelationship.objects.filter(agent=authenticated_user)
                print(f"Debug Middleware: All relationships for agent {authenticated_user.email}: {list(all_relationships.values_list('landlord__email', 'status'))}")
                
        except (ValueError, User.DoesNotExist) as e:
            print(f"Debug Middleware: Exception occurred: {e}")
            pass
            
        return None
