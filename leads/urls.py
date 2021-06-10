from django.urls import include, path
from . import views

urlpatterns = [
    path('api/lead/', views.LeadListCreate.as_view()),
    path('api/lead/auth/', include('rest_auth.urls')),
    path('api/lead/auth/register/', include('rest_auth.registration.urls'))
]
