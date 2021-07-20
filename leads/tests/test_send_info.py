from django.test import RequestFactory, TestCase
from leads.send_info import *
from leads.models import *
from leads.serializers import *
from django.http.request import HttpRequest
import requests
import json


class TestEmail(TestCase):
    def setUp(self):
        # add lead to db
        self.lead_attrs = {
            'username': 'test name',
            'email': 'test@gmail.com',
            'password': '1111'
        }
        self.lead = LeadSerializer(data=self.lead_attrs)
        self.lead.is_valid(raise_exception=True)

        # add instrument to db
        self.instrument_attrs = {
            'name': 'Test Tool Name',
            'symbol': 'TEST',
            'apikey': 'test_api_key',
            'type': 'Equity',
            'region': 'United States',
            'currency': 'USD',
        }
        self.instrument = InstrumentSerializer(data=self.instrument_attrs)
        self.instrument.is_valid(raise_exception=True)

    def test_create_operation_on_empty_request_failed(self):
        
        request = HttpRequest()
        request.method = 'POST'
        response = create_operation(request)

        self.assertEqual(response.data['success'], False)
        self.assertEqual(type(response.data['error']), KeyError)

        # print("\n")
        # print("_______________")
        # print(dir(response.data['error']))
        # print("_______________")
        # print("\n")

    def test_create_operation_on_invalid_instrument_failed(self):
        self.lead.create(self.lead.validated_data)
        self.instrument.create(self.instrument.validated_data)

        test_lead = Lead.objects.get(email=self.lead_attrs['email'])
        test_instrument = Instrument.objects.get(symbol=self.instrument_attrs['symbol'])

        data = {
            'old_quantity': 0,
            'status': 'update',
            'instrument': {
                'quantity': 10,
                'id': test_instrument.id,
            },
            'lead': {
                'id': test_lead.id,
            }
        }

        # you can send data or json, data will not go deeper
        #response = requests.post(url='http://127.0.0.1:8000/api/send_email/', json=data)
        #response = json.loads(response.content)

        response = self.client.post(path='/api/send_email/', data=data, content_type='application/json')

        self.assertEqual(response['success'], False)
        self.assertEqual(response["error"], 'Instrument object with provided id does not exist')

        # print("\n")
        # print("_______________")
        # print(response.text)
        # print("_______________")
        # print("\n")

    def test_create_operation_on_invalid_lead_failed(self):
        self.lead.create(self.lead.validated_data)
        self.instrument.create(self.instrument.validated_data)

        test_lead = Lead.objects.get(email=self.lead_attrs['email'])
        test_instrument = Instrument.objects.get(symbol=self.instrument_attrs['symbol'])

        all_instruments = Instrument.objects.all()

        data = {
            'old_quantity': 0,
            'status': 'update',
            'instrument': {
                'quantity': 10,
                'id': test_instrument.id,
            },
            'lead': {
                'id': -test_lead.id,  # wrong lead id
            }
        }

        # data = json.dumps(data)

        # you can send data or json, data will not go deeper
        response = self.client.post(path='/api/send_email/', data=data, content_type='application/json')

        # print("\n")
        # print("_______________")
        # print("Response:")
        # print(response.data)
        # print("_______________")
        # print("\n")

        response = json.loads(response.content)

        self.assertEqual(response['success'], False)
        self.assertEqual(response["error"], 'Lead object with provided id does not exist')


class TestInvitation(TestCase):
    def setUp(self):
        pass

    def test_create_invitation_on_empty_data_failed(self):
        response = self.client.post('/api/send_invitation/', data={}, content_type='application/json')
        print('\n')
        print("________________")
        print(response.data)
        print("________________")
        print("\n")

    def test_create_invitation_on_wrong_advisor_failed(self):
        pass

    def test_create_invitation_on_empty_email_failed(self):
        pass

    def test_create_invitation_on_valid_data(self):
        pass

    def test_get_invite_registration_token_failed(self):
        pass

    def test_post_invite_registration_token_failed(self):
        pass

    def test_get_invite_registration_token(self):
        pass

    def test_post_invite_registration_token(self):
        pass

    def test_get_invitations_of_advisor_failed(self):
        pass

    def test_get_invitations_of_advisor(self):
        pass
