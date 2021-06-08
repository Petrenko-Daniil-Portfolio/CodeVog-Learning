from django.db import models

from django.contrib.auth.models import AbstractUser

from .managers import LeadManager

from django.core.exceptions import ValidationError

# Create your models here.


class Lead(AbstractUser):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    apikey = models.JSONField(null=True)
    fin_advisor = models.ForeignKey('self', null=True, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now=True)
    password = models.CharField(max_length=140)

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = []

    objects = LeadManager()

    def __str__(self):
        return self.email


