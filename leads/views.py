import numpy as np

from .models import Lead, Portfolio, Instrument, TimeSeriesData
from .serializers import LeadSerializer, PortfolioSerializer, InstrumentSerializer, TimeSeriesDataSerializer
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django_filters.rest_framework import DjangoFilterBackend

from .tasks import create_time_series, update_all_time_series, update_single_time_series

from .errors import RequestLimitError

from django_pandas.io import read_frame

import json
import requests

from decimal import Decimal

import pandas as pd
from datetime import datetime, timedelta

from .data_source import DataSource


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

    # return Response(data={'success': False}, status=status.HTTP_400_BAD_REQUEST)
    return Response(data={'success': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
def portfolio_value(request):

    if request.method == "POST":
        # get data form GET
        lead = request.data['lead']

        qs_portfolio = Portfolio.objects.filter(user=lead['id']).values('instrument', 'quantity')
        df_portfolio = read_frame(qs_portfolio)

        currencies = []
        instruments = []

        currencies_time_series_fx = {}

        for row, column in df_portfolio.iterrows():

            instrument = Instrument.objects.get(symbol=column['instrument'])
            instruments.append(instrument)

            instrument_currency = getattr(instrument, 'currency')
            currencies.append(instrument_currency)

            if instrument.currency != 'EUR' and instrument.currency not in currencies_time_series_fx:
                response = requests.get(DataSource.TIME_SERIES_FX_QUERY.format(instrument.currency, instrument.apikey))
                response = json.loads(response.content)['Time Series FX (Daily)']  # !!!

                days_counter = 0
                day_price_dict = {}
                for key in response:
                    day_price_dict[key] = response[key]['4. close']

                    days_counter += 1
                    if days_counter > 35:
                        break
                currencies_time_series_fx[instrument.currency] = day_price_dict

        df_portfolio['currency'] = currencies

        month = []  # last 30 days
        for i in range(31, -1, -1):
            month.append((datetime.now() - timedelta(i)).strftime('%Y-%m-%d'))

        # create data frame with  indexes as days and instruments as columns
        df_portfolio_prices = pd.DataFrame(index=month, columns=instruments)

        # loop over instruments to get their time series
        instrument_counter = 0
        for instrument in instruments:
            qs_time_series = TimeSeriesData.objects.filter(instrument=instrument.id).order_by('date').values('date', 'close_price')
            df_time_series = read_frame(qs_time_series)

            # loop over time series to set close prices to df_portfolio_prices
            for i in df_time_series.index:

                # loop over df_portfolio_prices to fill all empty cells with close_prices * quantity if dates are equal
                for day in df_portfolio_prices.index:
                    if str(df_time_series.date[i]) == str(day):
                        df_portfolio_prices[instrument][day] = round(df_time_series.close_price[i] * df_portfolio.quantity[instrument_counter], 5)

                        # if currency in currencies fx list, daily price = daily price * fx
                        if df_portfolio.currency[instrument_counter] in currencies_time_series_fx:

                            df_portfolio_prices[instrument][day] *= Decimal(currencies_time_series_fx[df_portfolio.currency[instrument_counter]][day])
                            df_portfolio_prices[instrument][day] = round(df_portfolio_prices[instrument][day], 5)
            instrument_counter += 1

        # df_portfolio_prices = df_portfolio_prices.fillna(method='ffill', axis=0)
        df_portfolio_prices = df_portfolio_prices.ffill(axis=0)

        df_portfolio_prices['price'] = df_portfolio_prices[list(df_portfolio_prices.columns)].sum(axis=1)

        # remove strings that were not filled with ffill
        df_portfolio_prices.at['2021-06-01', instruments[0]] = np.NaN
        df_portfolio_prices.at['2021-06-01', instruments[1]] = np.NaN
        df_portfolio_prices.at['2021-06-01', instruments[2]] = np.NaN

        for row, columns in df_portfolio_prices.iterrows():
            nan_columns_number = columns.isnull().sum()

            if nan_columns_number == len(df_portfolio_prices.columns) - 1:
                # delete all empty rows
                print('delete')
                df_portfolio_prices = df_portfolio_prices.dropna(axis=0, how='any')
            elif nan_columns_number > 0:
                df_portfolio_prices = df_portfolio_prices.bfill(axis=0)

        # print(df_portfolio_prices)
        df_portfolio_prices.columns = df_portfolio_prices.columns.map(str)
        return Response(data={'success': True, 'data-frame': df_portfolio_prices.to_dict(orient='index')}, status=status.HTTP_200_OK)

    return Response(data={'success': False}, status=status.HTTP_400_BAD_REQUEST)
