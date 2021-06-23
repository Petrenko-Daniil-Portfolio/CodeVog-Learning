from learning_project.celery import app


import json
import requests

from .models import Lead, Portfolio, Instrument, TimeSeriesData
from .serializers import LeadSerializer, PortfolioSerializer, InstrumentSerializer, TimeSeriesDataSerializer


@app.task(bind=True)
def create_time_series(self, instrument_symbol, apikey):
    # 1) send request to data sourse
    response = requests.get(
        'https://www.alphavantage.co/query?' + 'function=TIME_SERIES_DAILY&symbol=' + instrument_symbol + '&apikey=' + apikey)

    # 2) call celery task
    response = json.loads(response.content)
    raw_time_series = response['Time Series (Daily)']

    instrument = Instrument.objects.get(symbol=instrument_symbol)

    counter = 0
    for date in raw_time_series:
        close = raw_time_series[date]['4. close']
        time_series = TimeSeriesData(date=date, close_price=close, instrument=instrument)
        time_series.save()
        counter += 1

        if counter >= 30:
            break



@app.task(bind=True)
def update_single_time_series(self):
    # send request to get time series
    # response = requests.get(instrument_apikey)
    # response = json.loads(response.content)
    #
    # # get close_prise of first element
    # raw_time_series = response['Time Series (Daily)']
    # print(raw_time_series)
    print("lol")


@app.task
def update_all_time_series():
    for instrument in Instrument.objects.all():
        update_single_time_series.apply_async((instrument.id, instrument.apikey), countdown=30)
