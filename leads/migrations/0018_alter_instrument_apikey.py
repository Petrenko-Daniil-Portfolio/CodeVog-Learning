# Generated by Django 3.2.4 on 2021-06-24 06:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0017_timeseriesdata'),
    ]

    operations = [
        migrations.AlterField(
            model_name='instrument',
            name='apikey',
            field=models.CharField(max_length=100),
        ),
    ]
