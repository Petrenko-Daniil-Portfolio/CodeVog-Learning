import io
import json

import requests

import pandas as pd
from django.conf import settings
from django.core.mail import EmailMessage
from openpyxl.utils import get_column_letter
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import *


@api_view(['POST'])
def create_operation(request):
    """ Endpoin to call when user portfolio is edited. Creates new option instance.

    :param HttpRequest request:
    :return: Response with success and data keys and status
    :rtype: Response
    """
    # return Response(data={'success': False, 'data_in_request': request.data}, status=status.HTTP_400_BAD_REQUEST)
    # get data

    try:
        old_quantity = request.data['old_quantity']
        new_quantity = request.data['instrument']['quantity']
        operation = request.data['status']
    except KeyError as e:
        return Response(data={'success': False, 'error': e}, status=status.HTTP_400_BAD_REQUEST)

    try:
        instrument = Instrument.objects.get(id=request.data['instrument']['id'])
        lead = Lead.objects.get(id=request.data['lead']['id'])

    except Instrument.DoesNotExist as e:
        error_message = 'Instrument object with provided id does not exist'
        return Response(data={'success': False, 'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

    except Lead.DoseNotExits as e:
        error_message = 'Lead object with provided id does not exist'
        return Response(data={'success': False, 'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

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


@api_view(['POST'])
def create_invitation(request):

    # 1) check if user with such email exists
    # 2) get all invitations of admin
    # 3) check if our invitation is in them

    # get data from request
    advisor_id = request.data['fin_advisor_id']
    email = request.data['receiver_email']# 2) get all invitations of admin

    # # check if such lead already exists
    # try:
    #     lead = Lead.objects.get(email=email)
    #
    #     # check if lead is fin advisor`s lead
    #     if lead.fin_advisor.id == advisor_id:
    #         return Response(data={'success': True, 'description': 'This user is already yours'},
    #                         status=status.HTTP_200_OK)
    #
    # except Lead.DoesNotExist:
    #     lead = None
    #
    # # check if is already invited
    # advisor = Lead.objects.get(id=advisor_id)
    # try:
    #     invite = Invitations.objects.get(email=email, fin_advisor=Lead.objects.get(id=advisor))
    #     if invite.status == 'sent':
    #         return Response(data={'success': True, 'description': 'This user already has invitation'},
    #                         status=status.HTTP_200_OK)
    #
    # except Invitations.DoesNotExist:
    #     invite = None
    #
    # # send letter with invitation on passed email
    #
    # message = f"""Dear, Investor!
    #     My name is {advisor.first_name} {advisor.last_name}.
    #     I want to suggest you creation of new financial portfolio in Berenberg Bank.
    #     ...
    #     Please click the link below to registrate
    # """
    # letter = EmailMessage(
    #     subject='Financial Portfolio Creation',
    #     body=message,
    #     from_email=settings.EMAIL_HOST_USER,
    #     to=email,
    # )
    #
    # # letter.send()



    return Response(data={'success': True}, status=status.HTTP_200_OK)
