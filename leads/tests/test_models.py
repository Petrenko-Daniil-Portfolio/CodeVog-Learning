from django.test import TestCase
from leads.models import Lead, Portfolio, Instrument


class TestModels(TestCase):

    # Test Lead
    def setUpUser(self):
        lead = Lead.objects.create(
            username='User For Django Tests',
            email='django_test_user@gmail.com',
            password='1111',
        )
        return lead

    def test_user_password_hashed(self):
        lead = self.setUpUser()

        self.assertNotEqual(lead.password, '1111')

    def test_user_to_str(self):
        lead = self.setUpUser()
        self.assertEqual(lead.__str__(), lead.email)

    # Test Portfolio
    def setUpInstrument(self):
        instrument = Instrument.objects.create(
            name='Tencent Holdings Ltd',
            symbol='TCTZF',
            apikey='https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=TCTZF&apikey=IGH18KMBJWZT5PXK',
            type='Equity',
            region='United States',
            currency='USD'
        )
        return instrument

    def test_instrument_to_str(self):
        instrument = self.setUpInstrument()
        self.assertEqual(instrument.__str__(), instrument.name)
