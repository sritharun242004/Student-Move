from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import AgentLandlordRelationship
from users.serializers import LandlordListSerializer


class AgentApprovedLandlordsView(generics.ListAPIView):
    """
    API endpoint for agents to get their approved landlords
    """
    serializer_class = LandlordListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only allow agents to access this endpoint
        if not self.request.user.groups.filter(name="agent").exists():
            return []
        
        # Get all active relationships for this agent
        active_relationships = AgentLandlordRelationship.objects.filter(
            agent=self.request.user,
            status='active'
        ).select_related('landlord')
        
        # Extract the landlords from the relationships
        landlords = [rel.landlord for rel in active_relationships]
        return landlords

    def list(self, request, *args, **kwargs):
        landlords = self.get_queryset()
        serializer = self.get_serializer(landlords, many=True)
        
        return Response({
            "status": "success",
            "message": "Active landlords retrieved successfully",
            "data": serializer.data,
        }, status=status.HTTP_200_OK)
