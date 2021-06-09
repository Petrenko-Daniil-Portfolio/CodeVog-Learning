from rest_framework import serializers
from .models import Lead

from django.contrib import auth
from rest_framework.exceptions import AuthenticationFailed

# model serializer


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

    def create(self, validated_data):
        lead = Lead.objects.create_user(username=validated_data['username'], email=validated_data['email'])
        lead.save()


class LoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    class Meta:
        model: Lead
        fields = ['email', 'password']

    def validate(self, attrs):
        email = attrs.get('emil')
        password = attrs.get('password')
        user = auth.authenticate(email=email, password=password)

        if not user:
            raise AuthenticationFailed("Invalid credentials")

        return {
            'email': user.email,
            'username': user.username
        }
