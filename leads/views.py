from django.shortcuts import render
from .models import Lead
from .serializers import LeadSerializer
from rest_framework import generics
# Create your views here.


class GetAllLeads(generics.ListCreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer


class GetOneLead(generics.RetrieveAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
