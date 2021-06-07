from rest_framework import serializers
from .models import Lead

# model serializer


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ('id', 'username', 'email', 'message')
