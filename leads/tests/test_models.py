from django.test import TestCase
from leads.models import Lead, Portfolio, Instrument


class TestModels(TestCase):

    # Test Lead
    def setUp(self):
        self.lead = Lead.objects.create(
            username='User For Django Tests',
            email='django_test_user@gmail.com',
            password='1111',
        )

        self.instrument = Instrument.objects.create(
            name='Tencent Holdings Ltd',
            symbol='TCTZF',
            apikey='https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=TCTZF&apikey=IGH18KMBJWZT5PXK',
            type='Equity',
            region='United States',
            currency='USD'
        )


    def test_user_password_hashed(self):

        self.assertNotEqual(self.lead.password, '1111')

    def test_user_to_str(self):
        self.assertEqual(self.lead.__str__(), self.lead.email)

    # Test Portfolio
    def test_instrument_to_str(self):
        self.assertEqual(self.instrument.__str__(), self.instrument.symbol)