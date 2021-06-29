from django.db import models

from django.contrib.auth.models import AbstractUser

from .managers import LeadManager

from django.contrib.auth.hashers import make_password

from model_utils.models import TimeStampedModel

from django.core.validators import MinValueValidator

# Create your models here.


class Lead(AbstractUser):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    image = models.ImageField(upload_to='images', null=True)

    apikey = models.JSONField(blank=True, null=True)
    fin_advisor = models.ForeignKey('self', null=True, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = []

    objects = LeadManager()

    def save(self, *args, **kwargs):
        if self.apikey is None:
            self.password = make_password(self.password)
            self.apikey = {'apikey': 'None'}
        super(Lead, self).save(*args, **kwargs)

    def __str__(self):
        return self.email


class Portfolio(models.Model):
    user = models.ForeignKey('Lead', on_delete=models.CASCADE, null=False)
    instrument = models.ForeignKey('Instrument', on_delete=models.DO_NOTHING, null=True)  # change to false later
    quantity = models.IntegerField(validators=[MinValueValidator(0.0)])

    objects = models.Manager


class Instrument(models.Model):
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=20, unique=True)
    apikey = models.CharField(max_length=100)  # change apikey so it is admin`s apikey

    type = models.CharField(max_length=50, null=True)
    region = models.CharField(max_length=50, null=True)
    currency = models.CharField(max_length=3, null=True)

    objects = models.Manager

    def __str__(self):
        return self.symbol


class TimeSeriesData(TimeStampedModel):
    date = models.DateField('Date')
    close_price = models.DecimalField(null=True, decimal_places=5, max_digits=12)
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE)

    objects = models.Manager
