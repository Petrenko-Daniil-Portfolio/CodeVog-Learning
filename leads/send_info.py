from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import EmailMessage

from rest_framework.decorators import api_view

from rest_framework.response import Response
from rest_framework import status

from django.forms.models import model_to_dict

from openpyxl.utils import get_column_letter

from datetime import datetime

import io

import json
import requests

from decimal import Decimal

import pandas as pd

from .models import Lead

@api_view(['POST'])
def send_email(request):

    instrument = request.data['instrument']
    instrument['status'] = request.data['status']
    old_quantity = request.data['old_quantity']

    lead = request.data['lead']
    fin_advisor = model_to_dict(Lead.objects.get(id=lead['fin_advisor']))

    email = _create_email_message(lead, fin_advisor, instrument)

    attachment = _create_excel_attachment(instrument, old_quantity)
    email.attach('Portfolio_Changes.xls', attachment, 'application/ms-excel')

    email.send(fail_silently=False)

    return Response(data={'success': True}, status=status.HTTP_200_OK)


def _create_email_message(lead, fin_advisor, instrument):
    print("PORTFOLIO:")
    print(instrument)
    lead_name = lead['first_name'] + " " + lead['last_name']
    advisor_name = fin_advisor['first_name'] + " " + fin_advisor['last_name']
    instrument_name = instrument['name']
    status = instrument['status']

    message = f'''Dear {lead_name}!
    Your portfolio has been changed by your financial manager {advisor_name}. You can see all changes in the attached file.
    Respectfully, CodeVog Company!'''

    email = EmailMessage(
        subject='Instrument '+status+': ' + instrument_name,
        body=message,
        from_email=settings.EMAIL_HOST_USER,
        to=[lead['email']],
    )
    return email

#  _____________________________


def _autofit_columns(df, worksheet):
    # Iterate through each col and set the width
    for i, col in enumerate(df.columns):
        # find length of column i
        column_len = len(df.columns[i]) + 5

        # set the column length
        worksheet.column_dimensions[get_column_letter(i + 2)].width = column_len  # +2 because columns starts from B

    # for column in df:
    #     column_width = max(df[column].astype(str).map(len).max(), len(column))
    #     col_idx = df.columns.get_loc(column)
    #     writer.sheets['instrument_changes'].column_dimensions[col_idx] = column_width !!!set_column did not work


def _create_excel_attachment(instrument, old_quantity):

    # convert instrument to df
    index = [instrument['symbol']]

    data = {
        'old quantity': old_quantity,
        'current quantity': instrument['quantity'],
        'date (Y-m-d)': datetime.today().strftime('%Y-%m-%d')
    }

    df = pd.DataFrame(data=data, index=index)

    memory_file = io.BytesIO()  # create file in buffer
    excel_writer = pd.ExcelWriter(memory_file, engine='openpyxl')  # specify which file with which engine to use
    df.to_excel(excel_writer, sheet_name=instrument['name'], header=True, index=True)

    worksheet = excel_writer.sheets[instrument['name']]

    _autofit_columns(df, worksheet)

    excel_writer.save()

    return memory_file.getvalue()
