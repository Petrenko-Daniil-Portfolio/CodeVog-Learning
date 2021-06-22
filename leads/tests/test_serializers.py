from django.test import TestCase
from leads.models import Lead, Portfolio, Instrument
from leads.serializers import LeadSerializer, PortfolioSerializer, InstrumentSerializer


class TestSerializers(TestCase):
    #Will be called before each test
    def setUp(self):
        # lead
        self.lead_attrs = {
            'username': 'pro100kvashuno',
            'email': 'andrei@gmail.com'
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

    def test_lead_save(self):
        self.lead_serializer.is_valid()
        self.lead_serializer.save()

        self.assertIn(self.lead, Lead.objects.all())

    def test_portfolio_update(self):
        portfolio_valid_data = {
            'user': self.lead,
            'instrument': self.instrument,
            'quantity': 15
        }
        self.portfolio_serializer.update(self.portfolio, portfolio_valid_data)
        self.assertEqual(self.portfolio.quantity, portfolio_valid_data.quantity)
