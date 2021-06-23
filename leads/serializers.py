from rest_framework import serializers
from .models import Lead, Portfolio, Instrument, TimeSeriesData

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


class InstrumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instrument
        fields = '__all__'


class PortfolioSerializer(serializers.ModelSerializer):
    # user = LeadSerializer()
    # instrument_set = InstrumentSerializer(many=True)

    class Meta:
        model = Portfolio
        fields = ('user', 'quantity', 'instrument', 'id')

    def update(self, instance, validated_data):
        instance.user = validated_data.get('user', instance.user)
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.instrument = validated_data.get('instrument', instance.instrument)

        instance.save()
        return instance


class TimeSeriesDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSeriesData
        fields = '__all__'


# class LoginSerializer(serializers.ModelSerializer):
#     email = serializers.EmailField()
#     password = serializers.CharField()
#
#     class Meta:
#         model: Lead
#         fields = ['email', 'password']
#
#     def validate(self, attrs):
#         email = attrs.get('emil')
#         password = attrs.get('password')
#         user = auth.authenticate(email=email, password=password)
#
#         if not user:
#             raise AuthenticationFailed("Invalid credentials")
#
#         return {
#             'email': user.email,
#             'username': user.username
#         }
