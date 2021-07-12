from datetime import date, timedelta

import requests

from learning_project.celery import app
from .data_source import DataSource
from .errors import RequestLimitError
from .send_info import *


@app.task(bind=True)
def create_time_series(self, instrument_symbol, fin_advisor_apikey):
    instrument = Instrument.objects.get(symbol=instrument_symbol)

    time_series_of_instrument = TimeSeriesData.objects.filter(instrument=instrument)
    time_series_of_instrument.delete()

    # 1) send request to data source
    response = requests.get(
        DataSource.TIME_SERIES_DAIL_QUERY.format(instrument_symbol, fin_advisor_apikey))

    # 2) call celery task
    response = json.loads(response.content)
    raw_time_series = response['Time Series (Daily)']

    if 'Time Series (Daily)' not in response:
        raise RequestLimitError(time_to_wait='60 seconds')

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
def update_single_time_series(self, instrument_id, instrument_symbol, instrument_apikey):
    # send request to get time series
    request = DataSource.TIME_SERIES_DAIL_QUERY.format(instrument_symbol, instrument_apikey)
    response = requests.get(request)
    response = json.loads(response.content)

    # if response not error get data
    if 'Time Series (Daily)' in response:
        # get data from response
        new_time_series = response['Time Series (Daily)']
        # new_time_series = raw_time_series.items()

        print(new_time_series.keys())
        date = next(iter(new_time_series.keys()))  # get first key
        print(date)
        print(new_time_series[date])
        close_price = new_time_series[date]['4. close']

        # get all time series of an object
        old_time_series = TimeSeriesData.objects.filter(instrument=instrument_id).order_by('-date')

        # check if new time series appeared
        if str(old_time_series[0].date) != date:
            # delete the oldest time series in DB
            index = len(old_time_series) - 1  # get index of oldest time series
            old_time_series[index].delete()

            # create today`s time series
            instrument = Instrument.objects.get(id=instrument_id)
            today_time_series = TimeSeriesData(date=date, close_price=close_price, instrument=instrument)
            today_time_series.save()
    else:
        print(response)


@app.task
def update_all_time_series():
    for instrument in Instrument.objects.all():
        update_single_time_series.apply_async((instrument.id, instrument.symbol, instrument.apikey), countdown=30)

    stat = json.dumps({'status': status.HTTP_201_CREATED})
    return stat


@app.task
def send_email_with_portfolio_changes():
    """Task is called every day at 17:30 (5:30 PM) to send email letters to all leads who portfolio has been changed

    :return:
    """

    today = date.today()
    # getting only today changes
    today_portfolio_operations = PortfolioOperations.objects.filter(timestamp__contains=today).order_by('lead')

    # unique leads
    leads_ids = today_portfolio_operations.values('lead').distinct()  # returns dict {'lead': id}

    # loop over leads to create letters for them
    for i, lead_id_dict in enumerate(leads_ids):
        lead = Lead.objects.get(id=lead_id_dict['lead'])
        operations_of_lead = today_portfolio_operations.filter(lead=lead)

        email = create_email_message(fin_advisor=lead.fin_advisor, lead=lead)

        attachment = create_excel_attachment(operations_of_lead)
        email.attach('Portfolio_changes.xls', attachment, 'application/ms-excel')
        email.send()

    # delete all portfolio operations that are older than 1 week

    days_ago = today-timedelta(days=10)
    PortfolioOperations.objects.filter(timestamp__lte=days_ago).delete()
    # print("All portfolio operations older than "+str(days_ago)+" where deleted")
