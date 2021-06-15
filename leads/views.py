from django.shortcuts import render
from .models import Lead, Portfolio, Instrument
from .serializers import LeadSerializer, PortfolioSerializer, InstrumentSerializer
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
# Create your views here.


class GetAllLeads(generics.ListCreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer


class GetOneLead(generics.RetrieveAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer


class GetOneInstrument(generics.RetrieveAPIView):
    queryset = Instrument.objects.all()
    serializer_class = InstrumentSerializer


@api_view(['GET'])
def portfolio_rows_of_lead(request, lead_id):
    if request.method == "GET":
        data = Portfolio.objects.filter(user=lead_id)

        serializer = PortfolioSerializer(data, many=True, context={'request': request})

        return Response(serializer.data)


