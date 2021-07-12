import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_project.settings')

app = Celery('learning_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'update_all_time_series': {
        'task': 'leads.tasks.update_all_time_series',
        'schedule': crontab(minute=10, hour=9),
    },
    'send_email_with_portfolio_changes': {
        'task': 'leads.tasks.send_email_with_portfolio_changes',
        'schedule': crontab(minute=30, hour=17)  # 30.0 crontab(minute=27, hour=11)
    },
}
