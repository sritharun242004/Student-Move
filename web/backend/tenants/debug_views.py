from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User, Group
from users.models import AgentLandlordRelationship


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_test_relationship(request):
    """
    Create a test agent-landlord relationship for debugging.
    This is for development/testing only.
    """
    try:
        # Get the current user (should be an agent)
        agent = request.user
        
        # Get landlord ID from request
        landlord_id = request.data.get('landlord_id')
        if not landlord_id:
            return Response(
                {"status": "error", "message": "landlord_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Verify user is an agent
        if not agent.groups.filter(name="agent").exists():
            return Response(
                {"status": "error", "message": "Only agents can create relationships"},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        # Get the landlord
        try:
            landlord = User.objects.get(id=landlord_id, groups__name="landlord")
        except User.DoesNotExist:
            return Response(
                {"status": "error", "message": "Landlord not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Create or update the relationship
        relationship, created = AgentLandlordRelationship.objects.get_or_create(
            agent=agent,
            landlord=landlord,
            defaults={
                'status': 'approved',
                'request_message': 'Test relationship for development',
            }
        )
        
        if not created and relationship.status != 'approved':
            relationship.status = 'approved'
            relationship.save()
        
        return Response({
            "status": "success",
            "message": "Relationship created/updated successfully",
            "data": {
                "agent": agent.email,
                "landlord": landlord.email,
                "status": relationship.status,
                "created": created,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"status": "error", "message": f"Error creating relationship: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def debug_relationships(request):
    """
    Debug endpoint to check all agent-landlord relationships.
    """
    try:
        user = request.user
        
        # Get all users and their groups
        users_info = []
        for u in User.objects.all():
            groups = [g.name for g in u.groups.all()]
            users_info.append({
                "id": u.id,
                "email": u.email,
                "groups": groups,
            })
        
        # Get all relationships
        relationships = []
        for rel in AgentLandlordRelationship.objects.all():
            relationships.append({
                "agent_email": rel.agent.email,
                "agent_id": rel.agent.id,
                "landlord_email": rel.landlord.email,
                "landlord_id": rel.landlord.id,
                "status": rel.status,
            })
        
        return Response({
            "status": "success",
            "data": {
                "current_user": {
                    "id": user.id,
                    "email": user.email,
                    "groups": [g.name for g in user.groups.all()],
                },
                "all_users": users_info,
                "all_relationships": relationships,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"status": "error", "message": f"Error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
