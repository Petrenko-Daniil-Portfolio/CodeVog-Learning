
from .models import Lead, Portfolio, Instrument, TimeSeriesData
from .serializers import LeadSerializer, PortfolioSerializer, InstrumentSerializer, TimeSeriesDataSerializer
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django_filters.rest_framework import DjangoFilterBackend

from .tasks import create_time_series, update_all_time_series, update_single_time_series

from errors import RequestLimitError


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

@api_view(['POST', 'PUT', 'PATCH', 'DELETE'])
def time_series(request):
    if request.method == 'POST':
        # get data from POST
        symbol = request.data['symbol']
        apikey = request.data['apikey']

        try:
            create_time_series.apply_async((symbol, apikey), countdown=30)
        except RequestLimitError as e:
            return Response(data={'error': e, 'success': False}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'PUT':
        update_all_time_series()

    if request.method == 'PATCH':

        instrument_id = request.data['instrument_id']

        symbol = request.data['instrument_symbol']
        apikey = request.data['instrument_apikey']
        update_single_time_series.apply_async((instrument_id, symbol, apikey), countdown=30)

    if request.method == 'DELETE':

        symbol = request.data['instrument_symbol']
        apikey = request.data['instrument_apikey']

        create_time_series.apply_async((symbol, apikey), countdown=30)

    return Response(data={'success': True}, status=status.HTTP_200_OK)

        # return Response(data={'success': False}, status=status.HTTP_400_BAD_REQUEST)

