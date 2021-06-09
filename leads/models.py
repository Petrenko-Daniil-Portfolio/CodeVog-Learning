from django.db import models

from django.contrib.auth.models import AbstractUser

from .managers import LeadManager

from django.contrib.auth.hashers import make_password

# Create your models here.


class Lead(AbstractUser):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    apikey = models.JSONField(blank=True, null=True)
    fin_advisor = models.ForeignKey('self', null=True, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = []

    objects = LeadManager()

    def save(self, *args, **kwargs):
        self.password = make_password(self.password)
        super(Lead, self).save(*args, **kwargs)

    def __str__(self):
        return self.email


