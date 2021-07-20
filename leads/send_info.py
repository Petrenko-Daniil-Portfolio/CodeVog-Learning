import io
import json

import requests

from django.shortcuts import redirect

from rest_framework.renderers import JSONRenderer
import pandas as pd
from django.conf import settings
from django.core.mail import EmailMessage
from openpyxl.utils import get_column_letter
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.db.utils import IntegrityError

from django.shortcuts import render

from .models import *

from .forms import LeadForm

from django.http import Http404, HttpResponse

from .serializers import InvitationsSerializer

from invitations.utils import get_invitation_model
from invitations.models import Invitation

from django.core.exceptions import ObjectDoesNotExist

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
        print("Create operation with instrument:")
        print(request.data['instrument']['id'])
        print("Instruments in DB:")
        for tool in Instrument.objects.all():
            print(tool.id)
        instrument = Instrument.objects.get(id=request.data['instrument']['id'])
        lead = Lead.objects.get(id=request.data['lead']['id'])

    except Instrument.DoesNotExist as e:
        error_message = 'Instrument object with provided id does not exist'
        return Response(data={'success': False, 'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

    except ObjectDoesNotExist as e:
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


# INVITATIONS STUFF
@api_view(['POST'])
def create_invitation(request):

    # get data from request
    advisor_id = request.data['fin_advisor_id']
    email = request.data['receiver_email']  # 2) get all invitations of admin

    advisor = Lead.objects.get(id=advisor_id)
    try:
        lead = Lead.objects.get(email=email)
        # check if lead is already fin advisor`s lead
        if lead.fin_advisor.id == advisor_id:
            return Response(data={'success': True, 'description': 'This user is already yours'},
                            status=status.HTTP_200_OK)
    except ObjectDoesNotExist:
        pass

    Invitation = get_invitation_model()

    # check if user already has invitation
    try:
        old_invitation = Invitation.objects.get(email=email)

        # if he has and it is expired -> delete old invitation
        if old_invitation.key_expired():
            old_invitation.delete()
        else:
            return Response(data={'success': True, 'description': 'This user already has invitation'},
                            status=status.HTTP_200_OK)
    except Invitation.DoesNotExist:
        pass

    invite = Invitation.create(email, inviter=advisor)
    invite.send_invitation(request)

    return Response(data={'success': True}, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
def invite_registration(request, token):

    if request.method == "POST":
        form = LeadForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()

            invitation = Invitation.objects.get(key=token.lower())
            invitation.accepted = True
            invitation.save()
            return redirect('http://localhost:3000/login')
        else:
            return render(request, 'pages/signup.html', {'form': form})

    # get invite via token
    try:
        invitation = Invitation.objects.get(key=token.lower())
    except Invitation.DoesNotExist:
        invitation = None

    response = check_invitation_state(invitation)
    if not response['success']:
        return render(request, 'pages/signup.html', context={'error_message': response['error-message']})

    # extract data from invitation to pre-populate fields with values
    fin_advisor = Lead.objects.get(id=invitation.inviter_id)
    email = invitation.email
    form = LeadForm(fin_advisor=fin_advisor, email=email)
    context = {
        'success': 'true',
        'form': form,
    }
    return render(request, 'pages/signup.html', context)


@api_view(['GET'])
def get_invitations_of_advisor(request, advisor_id):
    # get all invitations of advisor
    # sort them by categories ( expired, sent, accepted )
    # return response with 3 categories

    Invitation = get_invitation_model()
    invitations_qs = Invitation.objects.filter(inviter_id=advisor_id)

    content = dict()

    content['accepted'] = list(invitations_qs.filter(accepted=True))
    content['sent'] = get_sent_invitations(invitations_qs)
    content['expired'] = get_expired_invitations(invitations_qs)

    for category in content:
        for index, invite in enumerate(content[category]):

            serializer = InvitationsSerializer(invite)
            content[category][index] = serializer.data
            content[category][index]['status'] = category

    return Response(data={'success': True, 'data': content}, status=status.HTTP_200_OK)


def check_invitation_state(invitation):
    response = {
        'success': True,
        'error-message': None,
    }

    # No invitation was found.
    if not invitation:
        response['success'] = False
        response['error-message'] = 'Invitation Not Found'

    # The invitation was previously accepted, redirect to the login view
    elif invitation.accepted:
        response['success'] = False
        response['error-message'] = 'Invitation Has Already Been Accepted'

    # The key was expired.
    elif invitation.key_expired():
        response['success'] = False
        response['error-message'] = 'Invitation Has Already Expired'

    return response


def get_sent_invitations(invitations_qs):
    unaccepted_invitations_qs = invitations_qs.filter(accepted=False)

    sent_invitations = []
    for invitation in unaccepted_invitations_qs:
        if not invitation.key_expired():
            sent_invitations.append(invitation)

    return sent_invitations


def get_expired_invitations(invitations_qs):
    expired_invitations = []
    for invitation in invitations_qs:
        if invitation.key_expired():
            expired_invitations.append(invitation)

    return expired_invitations
