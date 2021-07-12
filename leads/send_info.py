import io
import json

import pandas as pd
from django.conf import settings
from django.core.mail import EmailMessage
from openpyxl.utils import get_column_letter
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import *
from .models import Lead


@api_view(['POST'])
def create_options(request):
    """ Endpoin to call when user portfolio is edited. Creates new option instance.

    :param HttpRequest request:
    :return: Response with success and data keys and status
    :rtype: Response
    """
    return Response(data={'success': False, 'data_in_request': request.data}, status=status.HTTP_400_BAD_REQUEST)
    # get data

    try:
        old_quantity = request.data['old_quantity']
        new_quantity = request.data['instrument']['quantity']
        operation = request.data['status']
    except KeyError as e:
        return Response(data={'success': False, 'error': e}, status=status.HTTP_400_BAD_REQUEST)

    instrument = Instrument.objects.get(id=request.data['instrument']['id'])
    lead = Lead.objects.get(id=request.data['lead']['id'])

    portfolio_operation = PortfolioOperations.objects.create(old_quantity=old_quantity, new_quantity=new_quantity,
                                                             operation=operation, instrument=instrument, lead=lead)

    return Response(data={'success': True}, status=status.HTTP_200_OK)


def create_email_message(lead, fin_advisor, operation='Update'):
    """Returns email operations message

    :param Lead lead: lead who portfolio had been changed and who we are sending this letter to
    :param Lead fin_advisor: financial advisor of lead
    :param str operation: operation that was performed
    :return: email message without attachment that tells about portfolio changes
    :rtype: EmailMessage
    """
    lead_name = lead.first_name + " " + lead.last_name
    advisor_name = fin_advisor.first_name + " " + fin_advisor.last_name

    message = f'''Dear {lead_name}!
    Your portfolio has been changed by your financial manager {advisor_name}. You can see all changes in the attached file.
    Respectfully, CodeVog Company!'''

    email = EmailMessage(
        subject='Portfolio ' + operation,
        body=message,
        from_email=settings.EMAIL_HOST_USER,
        to=[lead.email],
    )
    return email


def create_excel_attachment(operations):
    """Returns excel attachment

    :param QuerySet operations: query set of operations
    :return: attachment filled with operations sorted by date and symbol
    :rtype: bytes
    """
    symbols = [operation.instrument.symbol for operation in operations]

    df = pd.DataFrame(data=list(operations.values('operation', 'old_quantity', 'new_quantity', 'timestamp')))
    df.insert(0, 'symbol', symbols)

    df['timestamp'] = df.timestamp.dt.strftime("%d-%m-%Y %H:%M:%S")
    df.rename(columns={'timestamp': "date\n(d-m-y h:m:s)"}, inplace=True)

    df.sort_values(by=['symbol', 'date\n(d-m-y h:m:s)'], ascending=[False, False], inplace=True, ignore_index=True)

    memory_file = io.BytesIO()  # create file in buffer
    excel_writer = pd.ExcelWriter(memory_file, engine='openpyxl')  # specify which file with which engine to use
    df.to_excel(excel_writer, sheet_name='Changed Instruments', header=True, index=True)

    worksheet = excel_writer.sheets['Changed Instruments']

    _autofit_columns(df, worksheet)

    excel_writer.save()

    return memory_file.getvalue()


def _autofit_columns(df, worksheet):
    """Automatically changes size of col due to it`s name

    :param pd.DataFrame df: pandas data frame
    :param Sheet worksheet: sheet of pandas excel writer
    :return:
    """
    # Iterate through each col and set the width
    for i, col in enumerate(df.columns):
        # find length of column i
        column_len = len(df.columns[i]) + 5

        # set the column length
        worksheet.column_dimensions[get_column_letter(i + 2)].width = column_len  # +2 because columns starts from B
