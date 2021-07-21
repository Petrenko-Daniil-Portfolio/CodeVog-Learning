import io
import json
import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import *
from .serializers import *

from django.http import Http404, HttpResponse
from rest_framework import status

from xlsxwriter.workbook import Workbook


@api_view(['POST'])
def download_portfolio_as_excel(request, lead_id):

    try:
        # get dataframe of instruments with quantity
        df = _get_instruments_df(lead_id)
    except Portfolio.DoesNotExist:
        return Response(data={'success': False, 'data': None}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df_ts = pd.DataFrame.from_dict(request.data['data-frame'], orient='index')
    except KeyError as e:
        message = "Please, make sure you passed 'data-frame' inside body."
        return Response(data={'success': False, 'error': message}, status=status.HTTP_400_BAD_REQUEST)

    # create excel document
    memory_file = io.BytesIO()  # A binary stream using an in-memory bytes buffer. It creates file in memory

    # Class for writing DataFrame objects into excel sheets, should be used as a context manager.
    # Context managers allow you to allocate and release resources precisely when you want to
    excel_writer = pd.ExcelWriter(memory_file, engine='xlsxwriter')  # specify which file with which engine to use

    df_ts.index.name = 'year-month-day'
    df_ts.reset_index(level=0, inplace=True)

    df.to_excel(excel_writer, sheet_name='Instruments', header=True, index=True)
    df_ts.to_excel(excel_writer, sheet_name='Time Series', header=True, index=True)

    # adjusting column width
    _worksheet_column_auto_fit(df, excel_writer.sheets['Instruments'])
    _worksheet_column_auto_fit(df_ts, excel_writer.sheets['Time Series'])

    excel_writer.save()  # saves made changes to the document (memory_file)

    # Change the stream position to the given byte offset
    memory_file.seek(0)  # go to the beginning of the file

    # content_type determins in wich format the data will be send.
    # For example content_type='application/zip' will send data as zip archive
    # memory_file.read() - return bytes till the end of the file
    response = HttpResponse(memory_file.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    # Telling the browser to treat the response as a file attachment
    response['Content-Disposition'] = 'attachment; filename=Instruments.xlsx'

    return response


def _get_instruments_df(lead_id):
    """Returns data frame of instruments

    :param int lead_id: identifier of lead
    :return: Returns data frame of instruments with their quantity but without names
    :rtype: pd.DataFrame
    """
    portfolio = Portfolio.objects.filter(user=lead_id)
    instruments = Instrument.objects.filter(pk__in=portfolio.values('instrument'))  # get all instruments in portfolio

    df = pd.DataFrame(list(instruments.values('symbol', 'currency', 'type', 'region')))

    instruments_quantities = [instrument.quantity for instrument in portfolio]
    df.insert(1, 'quantity', instruments_quantities, True)

    return df


def _worksheet_column_auto_fit(df, worksheet):
    for col_index in range(df.shape[1]):
        max_length = len(df.columns[col_index])+1
        for row_index in range(df.shape[0]):

            cell_length = len(str(df.iloc[row_index, col_index]))
            if cell_length > max_length:
                max_length = cell_length

        # workbook = writer.book  format = workbook.add_format({'bold': True})
        worksheet.set_column(first_col=col_index+1, last_col=col_index+1, width=max_length+2, cell_format=format)

