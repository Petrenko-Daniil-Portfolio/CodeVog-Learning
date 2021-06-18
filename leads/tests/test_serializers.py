from django.test import TestCase
from leads.models import Lead, Portfolio, Instrument
from leads.serializers import LeadSerializer, PortfolioSerializer, InstrumentSerializer


class TestLeadSerializer(TestCase):
    #Will be called before each test
    def setUp(self):
        self.lead_attrs = {
            'username': 'pro100kvashuno',
            'email': 'andrei@gmail.com'
        }

        self.lead = Lead.objects.create(**self.lead_attrs)
        self.lead_serializer = LeadSerializer(instance=self.lead)

    def test_lead_save(self):
        self.lead_serializer.save()

