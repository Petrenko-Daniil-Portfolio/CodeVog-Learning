from django.test import TestCase

from leads.serializers import *


class TestSerializers(TestCase):

    def setUp(self):
        # lead
        self.lead_attrs = {
            'username': 'test_andrei_username',
            'email': 'andrei@gmail.com',
            'password': '1111'
        }

        self.lead = Lead.objects.create(**self.lead_attrs)
        self.lead_serializer = LeadSerializer(instance=self.lead)

        # instrument
        self.instrument_attrs = {
            'name': 'Apple Corporation',
            'symbol': 'APPL',
            'apikey': 'some-api-key',
            'type': 'Equity',
            'region': 'South America',
            'currency': 'USD',
        }
        self.instrument = Instrument.objects.create(**self.instrument_attrs)
        self.instrument_serializer = InstrumentSerializer(instance=self.instrument)

        # portfolio
        self.portfolio_attrs = {
            'user': self.lead,
            'instrument': self.instrument,
            'quantity': 10
        }
        self.portfolio = Portfolio.objects.create(**self.portfolio_attrs)
        self.portfolio_serializer = PortfolioSerializer(instance=self.portfolio)

        # time series
        self.time_series_attrs_1 = {
            'date': '2010-10-27',
            'close_price': 15.45,
            'instrument': self.instrument
        }
        self.time_series = TimeSeriesData.objects.create(**self.time_series_attrs_1)
        self.time_series_serializer = TimeSeriesDataSerializer(instance=self.time_series)

    # EXPECTED FIELDS TESTS
    def test_lead_serializer_contains_expected_fields(self):
        data = self.lead_serializer.data
        self.assertEqual(set(data.keys()),
                         {'id', 'password', 'last_login', 'is_superuser', 'first_name', 'last_name', 'is_staff',
                          'is_active', 'date_joined', 'username', 'email', 'image', 'apikey', 'created_at',
                          'fin_advisor', 'groups', 'user_permissions'})

    def test_instrument_serializer_contains_expected_fields(self):
        data = self.instrument_serializer.data
        self.assertEqual(set(data.keys()), {'id', 'name', 'symbol', 'apikey', 'type', 'region', 'currency'})

    def test_portfolio_serializer_contains_expected_fields(self):
        data = self.portfolio_serializer.data
        self.assertEqual(set(data.keys()), {'id', 'user', 'instrument', 'quantity'})

    def test_time_series_serializer_contains_expected_fields(self):
        data = self.time_series_serializer.data
        self.assertEqual(set(data.keys()), {'id', 'date', 'close_price', 'instrument', 'modified', 'created'})

    # TEST FIELDS CONTENT
    def test_lead_serializer_fields(self):
        data = self.lead_serializer.data
        self.assertEqual(data['email'], self.lead_attrs['email'])
        self.assertEqual(data['username'], self.lead_attrs['username'])

        self.assertEqual(data['is_superuser'], False)
        self.assertEqual(data['is_staff'], False)
        self.assertEqual(data['is_active'], True)
        self.assertEqual(data['image'], None)
        self.assertEqual(data['apikey'], {'apikey': 'None'})

    def test_instrument_serializer_fields(self):
        data = self.instrument_serializer.data

        self.assertEqual(data['name'], self.instrument_attrs['name'])
        self.assertEqual(data['symbol'], self.instrument_attrs['symbol'])
        self.assertEqual(data['apikey'], self.instrument_attrs['apikey'])
        self.assertEqual(data['region'], self.instrument_attrs['region'])
        self.assertEqual(data['currency'], self.instrument_attrs['currency'])

    def test_portfolio_serializer_fields(self):
        data = self.portfolio_serializer.data

        self.assertEqual(data['user'], self.portfolio_attrs['user'].id)
        self.assertEqual(data['quantity'], self.portfolio_attrs['quantity'])
        self.assertEqual(data['instrument'], self.portfolio_attrs['instrument'].id)

    def test_time_series_serializer_fields(self):
        data = self.time_series_serializer.data

        self.assertEqual(data['date'], self.time_series_attrs_1['date'])
        self.assertEqual(float(data['close_price']), self.time_series_attrs_1['close_price'], 5)
        self.assertEqual(data['instrument'], self.time_series_attrs_1['instrument'].id)

    # TEST EXTENDED FUNCTIONS
    def test_lead_serializer_create_func(self):
        lead_attrs = {
            'username': 'test name',
            'email': 'test@gmail.com',
            'password': '1111'
        }
        lead = LeadSerializer(data=lead_attrs)
        lead.is_valid(raise_exception=True)
        print(lead.create(lead.validated_data))

    # TEST ON DUPLICATE FIELDS
    def test_lead_serializer_duplicate_email(self):
        duplicate_lead_attrs = {
            'username': 'test name',
            'email': 'andrei@gmail.com',
            'password': '1111'
        }
        test_serializer = LeadSerializer(data=self.lead_attrs)
        self.assertFalse(test_serializer.is_valid())
        self.assertEqual(test_serializer.errors.keys(), {'email'})

    def test_instrument_serializer_duplicate_symbol(self):
        duplicate_instrument_attrs = {
            'name': 'Duplicate Apple Corporation',
            'symbol': 'APPL',
            'apikey': 'duplicate some-api-key',
            'type': 'Bond',
            'region': 'East America',
            'currency': 'EUR',
        }
        test_serializer = InstrumentSerializer(data=duplicate_instrument_attrs)
        self.assertFalse(test_serializer.is_valid())
        self.assertEqual(test_serializer.errors.keys(), {'symbol'})

    # TEST ON INVALID FIELDS CONTENT
    def test_lead_serializer_invalid_email(self):
        self.lead_attrs['email'] = 'random_text'
        test_serializer = LeadSerializer(data=self.lead_attrs)

        self.assertFalse(test_serializer.is_valid())
        self.assertEqual(test_serializer.errors.keys(), {'email'})

    def test_lead_serializer_invalid_password(self):
        # password is not set
        self.lead_attrs['password'] = ''
        test_serializer = LeadSerializer(data=self.lead_attrs)

        self.assertFalse(test_serializer.is_valid())
        self.assertEqual(test_serializer.errors.keys(), {'password', 'email'})

    def test_instrument_serializer_invalid_symbol(self):
        # too long currency
        self.instrument_attrs['currency'] = 'far too long currency'
        test_serializer = InstrumentSerializer(data=self.instrument_attrs)

        self.assertFalse(test_serializer.is_valid())
        # self.assertEqual(test_serializer.errors.keys(), {'currency'})
