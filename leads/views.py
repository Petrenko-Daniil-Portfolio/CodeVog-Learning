import json

from django.shortcuts import render
from .models import Lead, Portfolio, Instrument, TimeSeriesData
from .serializers import LeadSerializer, PortfolioSerializer, InstrumentSerializer, TimeSeriesDataSerializer
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.http import HttpResponse, HttpRequest
from django_filters.rest_framework import DjangoFilterBackend

import requests
from rest_framework.mixins import CreateModelMixin

from .tasks import create_time_series

from django.shortcuts import get_object_or_404
import django_filters
# Create your views here.


class GetAllLeads(generics.ListCreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer


class GetOneLead(generics.RetrieveAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer


class GetAllInstruments(generics.ListCreateAPIView):
    queryset = Instrument.objects.all()
    serializer_class = InstrumentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name', 'symbol']
    #TYT


class GetOneInstrument(generics.RetrieveAPIView):
    queryset = Instrument.objects.all()
    serializer_class = InstrumentSerializer

    # lookup_field = ['pk', 'name', 'symbol']


class PortfolioView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer


class PortfolioCreateView(generics.ListCreateAPIView):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer


# ------------------------------------------------------
class TimeSeriesDataView(generics.ListCreateAPIView):
    queryset = TimeSeriesData.objects.all()
    serializer_class = TimeSeriesDataSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['instrument']


@api_view(['GET'])
def portfolio_rows_of_lead(request, lead_id):
    if request.method == "GET":
        data = Portfolio.objects.filter(user=lead_id)

        serializer = PortfolioSerializer(data, many=True, context={'request': request})

        return Response(serializer.data)


# celery related

@api_view(['POST'])
def time_series(request):

    if request.method == 'POST':
        # 1) get data from POST
        symbol = request.data['symbol']
        apikey = request.data['apikey']

        create_time_series.apply_async((symbol, apikey), countdown=30)

    return HttpResponse("it works")
