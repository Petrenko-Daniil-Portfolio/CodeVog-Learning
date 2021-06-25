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
        'schedule': crontab(minute=45, hour=9),
    },
}
