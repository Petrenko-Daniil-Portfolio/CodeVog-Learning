from django.urls import include, path
from . import views

urlpatterns = [
    path('api/lead/', views.GetAllLeads.as_view()),
    path('api/lead/<pk>/', views.GetOneLead.as_view()),  # get single lead


    path('api/lead/auth/', include('rest_auth.urls')),
    path('api/lead/auth/register/', include('rest_auth.registration.urls'))
]
