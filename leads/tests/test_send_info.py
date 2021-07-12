from django.test import TestCase
from leads.send_info import *
from leads.models import *
from django.http.request import HttpRequest
import requests
import json


class TestSendInfo(TestCase):
    def test_create_options_on_empty_request(self):
        pass
        # request = HttpRequest()
        # request.method = 'POST'
        # response = create_options(request)
        #
        # self.assertEqual(response.data['success'], False)
        # self.assertEqual(type(response.data['error']), KeyError)

        # print("\n")
        # print("_______________")
        # print(dir(response.data['error']))
        # print("_______________")
        # print("\n")

    def test_create_options_on_invalid_lead(self):

        data = {
            'old_quantity': 0,
            'status': 'update',
            'instrument': {
                'quantity': 10,
                'id': -100
            },
            'lead': {
                'id': -100,
            }
        }

        response = requests.post(url='http://127.0.0.1:8000/api/send_email/', data=data)
        print("\n")
        print("_______________")
        print(response.text)
        print("_______________")
        print("\n")
