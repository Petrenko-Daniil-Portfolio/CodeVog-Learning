# Generated by Django 3.2.4 on 2021-06-09 06:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0010_alter_lead_password'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lead',
            name='password',
            field=models.CharField(max_length=128, verbose_name='password'),
        ),
    ]
