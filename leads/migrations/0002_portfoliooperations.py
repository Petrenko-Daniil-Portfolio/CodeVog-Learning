# Generated by Django 3.2.4 on 2021-07-08 14:31

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PortfolioOperations',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now=True)),
                ('operation', models.CharField(max_length=30)),
                ('old_quantity', models.IntegerField(validators=[django.core.validators.MinValueValidator(0.0)])),
                ('new_quantity', models.IntegerField(validators=[django.core.validators.MinValueValidator(0.0)])),
                ('instrument', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='leads.instrument')),
                ('lead', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
