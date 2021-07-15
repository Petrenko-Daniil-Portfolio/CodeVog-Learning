import json
from decimal import Decimal

import pandas as pd
import requests
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .data_source import DataSource
from .errors import DuplicateDatesInInstrumentTimeSeries
from .errors import RequestLimitError
from .models import Lead, Portfolio, Instrument, TimeSeriesData
from .serializers import LeadSerializer, PortfolioSerializer, InstrumentSerializer, TimeSeriesDataSerializer
from .tasks import create_time_series, update_all_time_series, update_single_time_series
from django.http import HttpResponse

from django.core.cache import cache

@api_view(['GET'])
def test_view(request):

    return HttpResponse("Cache: "+cache.get('key', None))

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
    """Endpoint to create time_series for instrument

    :param request:
    :return: Response with success: try key value pair
    :rtype: Response
    """
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
    """Endpoint to get portfolio value time series dataframe

    :param request:
    :return: Response with dataframe that contains portfolio values for past 30 days including fx rates
    :rtype: Response
    """
    if request.method == "POST":
        # get data form request
        lead = request.data['lead']

        qs_portfolio = Portfolio.objects.filter(user=lead['id']).values('instrument', 'quantity')

        instruments = _get_instruments_of_portfolio(qs_portfolio)

        instruments_ts = _get_instrument_time_series(instruments)
        instruments_ts = _multiply_by_fx_rate(instruments_ts)  # get instruments time series with fx included

        price_df = _instruments_ts_to_df(instruments_ts)
        # get sum of all columns
        price_df['price'] = price_df[price_df.columns].sum(axis=1)

        price_df.index = price_df.index.map(str)
        print(price_df)
        df = price_df.to_dict(orient='index')

        return Response(data={'success': True, 'data-frame': df}, status=status.HTTP_200_OK)

    return Response(data={'success': False}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def portfolio_values_of_advisor(request, advisor_id):
    # limit to get only last certain amount of days
    limit = 4

    advisor = Lead.objects.get(id=advisor_id)
    serializer = LeadSerializer(advisor)

    leads_of_advisor = Lead.objects.filter(fin_advisor=advisor, is_staff=False)

    # convert each lead to dict
    leads_of_advisor = [LeadSerializer(lead).data for lead in leads_of_advisor]

    portfolio_values = {}  # dict
    for lead in leads_of_advisor:

        qs_portfolio = Portfolio.objects.filter(user=lead['id']).values('instrument', 'quantity')

        instruments = _get_instruments_of_portfolio(qs_portfolio)

        instruments_ts = _get_instrument_time_series(instruments, limit=limit)

        instruments_ts = _multiply_by_fx_rate(instruments_ts, limit=limit)  # get instruments time series with fx included

        # for t in instruments_ts:
        #     print(t['symbol'])
        #     for s in t['time_series']:
        #         print(s['date'])

        price_df = _instruments_ts_to_df(instruments_ts, limit)

        # get sum of all columns
        price_df['price'] = price_df[price_df.columns].sum(axis=1)

        price_df.index = price_df.index.map(str)
        #print(price_df)
        df = price_df.to_dict(orient='index')

        portfolio_values[lead['email']] = df

    return Response(data={'success': True, "data-frames": portfolio_values}, status=status.HTTP_200_OK)


def _get_instruments_of_portfolio(portfolio):
    """Returns list of instruments

    :param list portfolio: list of instruments in lead`s portfolio
    :return: Returns list of instruments with their quantities
    :rtype: list[dict]
    """
    instruments = []
    for item in portfolio:
        instrument = Instrument.objects.get(id=item['instrument'])

        instruments.append({
            # 'instrument': instrument,
            'id': instrument.id,
            'apikey': instrument.apikey,
            'currency': instrument.currency,
            'symbol': instrument.symbol,
            'quantity': item['quantity']
        })
    return instruments


def _get_instrument_time_series(instruments, limit=None):
    """ Return instruments time series

    :param list instruments: list of dictionaries. Each element contains instrument and its quantity
    :return: List of instruments with their time series. Close price includes quantity
    :rtype: list[dict]
    """

    ts = []
    # loop over instruments to get their time series
    for i, instrument in enumerate(instruments):

        # select first limit rows if limit was passed
        if limit is not None:
            ts_qs = TimeSeriesData.objects.filter(instrument=instrument['id']).order_by('-date')[:limit].values()
            ts_qs = reversed(ts_qs)
        else:
            ts_qs = TimeSeriesData.objects.filter(instrument=instrument['id']).order_by('date').values()

        ts.append(
            {
                'symbol': instrument['symbol'],
                'apikey': instrument['apikey'],
                'currency': instrument['currency'],
                'time_series': []
            }
        )

        # loop over time series to * by quantity. Add them to list of time_series
        for counter, time_series in enumerate(ts_qs):
            close_price = round(time_series['close_price'] * instrument['quantity'], 5)
            ts[i]['time_series'].append({
                'date': time_series['date'],
                'close_price': close_price
            })
    # for elem in ts:
    #     for j in elem['time_series']:
    #         print(j)
    # print("-----------------")
    return ts


def _get_uniq_currencies_in_time_series(time_series):
    """Get uniq currencies in time series list except EUR

    :param list[dict] time_series: list of dicts. Each element must contain currency key
    :return: list of currencies
    :rtype: list[str]
    """
    currencies = []
    for item in time_series:
        if item['currency'] not in currencies and item['currency'] != 'EUR':
            currencies.append(item['currency'])

    return currencies


def _get_time_series_with_fx_rate(currencies, apikey, limit=45):
    """Return time_series of currencies and their fx rates for past 45 days

    :param list[str] currencies: list of currencies
    :param str apikey: apikey to make request to data source
    :param int limit: integer, shows how many days to return
    :return: dict where days are keys, fix rate close prices are values
    :rtype: dict
    """
    fx_rate_time_series = {}
    for currency in currencies:

        response = cache.get(currency+"_fx", None)
        if response is None:
            req_url = DataSource.TIME_SERIES_FX_QUERY.format(currency, apikey)
            response = requests.get(req_url)
            response = json.loads(response.content)['Time Series FX (Daily)']
            cache.set(currency+"_fx", response, 60*60)


        fx_rate_time_series[currency] = {}

        counter = 0
        for day in response:
            fx_rate_time_series[currency][day] = response[day]['4. close']
            counter += 1
            if counter == limit:
                break

    return fx_rate_time_series


def _multiply_by_fx_rate(instruments, limit=45):
    """Return instrument with time series which where multiplied by quantity of instruments in portfolio

    :param list[dict[str]] instruments: list of dicts. Each dict represents single time series of instrument.
    :return: list of time series with fix rate included in close_price
    :rtype: list[dict]
    """

    currencies = _get_uniq_currencies_in_time_series(instruments)

    # if there are more than 4 currencies we will be banned for 1 min so we need to call celery task
    if len(currencies) > 4:
        pass  # TODO add task to call if there will be more than 4 requests

    apikey = instruments[0]['apikey']  # lead has one fin advisor so we can use any apikey
    fx_rate_time_series = _get_time_series_with_fx_rate(currencies, apikey, limit)

    # loop over instruments
    for instrument in instruments:
        currency = instrument['currency']
        if currency == 'EUR':
            continue

        time_series = instrument['time_series']
        last_existing_date = None  # this part is used to avoid corner cases
        for i, row in enumerate(time_series):

            try:
                date = str(row['date'])
                row['close_price'] = row['close_price'] * Decimal(fx_rate_time_series[currency][date])
                last_existing_date = date

            except KeyError:

                if last_existing_date is not None:
                    row['close_price'] = row['close_price'] * Decimal(fx_rate_time_series[currency][last_existing_date])
                else:
                    dates = list(fx_rate_time_series[currency].keys())
                    last_existing_date = dates[0]  # select first available day
                    row['close_price'] = row['close_price'] * Decimal(fx_rate_time_series[currency][last_existing_date])

            row['close_price'] = round(row['close_price'], 5)

    return instruments


def _instruments_ts_to_df(instruments_ts, limit=None):
    """Return time series data frame of instruments with close prices

    :param list[dict] instruments_ts: list of instruments where each instrument is dict
    :return: pandas data frame with dates as indexes, instruments as columns and close_prices as cells
    :rtype: pd.DataFrame
    """
    price_df = pd.DataFrame()
    counter = 0
    for item in instruments_ts:
        df = pd.DataFrame(item.get('time_series'), columns=['close_price', 'date'])
        df = df.rename(columns={"close_price": item['symbol'],
                                "date": "Date"})
        df.set_index(keys='Date', inplace=True)

        # if axis = 0 we will duplicate indexes (add them to the end of df), but we want to add columns
        try:
            if counter > 0:

                if price_df.index[-1] > df.index[-1]:
                    price_df = pd.merge(price_df, df, how='left', left_index=True, right_index=True)
                elif price_df.index[-1] < df.index[-1]:
                    price_df = pd.merge(price_df, df, left_index=True, right_index=True)
                else:
                    price_df = pd.merge(price_df, df, how='outer', left_index=True, right_index=True)
            else:
                price_df = pd.concat([price_df, df], axis=1)

            # price_df = pd.concat([price_df, df], axis=1)
            price_df.sort_index(inplace=True)

        except pd.errors.InvalidIndexError:
            print('\n\033[93m' + 'CUSTOM ERROR' + '\033[0m')
            print('You have duplicate dates in ' + item['symbol'] + " time series\n")
            raise (DuplicateDatesInInstrumentTimeSeries(instrument=item['symbol']))

        counter += 1

    if limit is not None and len(price_df) > limit:
        while len(price_df) > limit:
            price_df.drop(index=price_df.index[0], axis=0, inplace=True)

    price_df.fillna(method='ffill', inplace=True)

    # if first day of all tools is NaN - delete it. else - make bfill
    if price_df.iloc[0].isnull().sum() == len(price_df.columns):
        price_df.dropna(axis=0, how='all', inplace=True)

    for col in price_df:

        nan_elems_number = price_df[col].isnull().sum()
        if nan_elems_number > 0:
            price_df.fillna(method='bfill', inplace=True)

    return price_df
