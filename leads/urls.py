from django.urls import include, path
from leads import views

urlpatterns = [
    path('api/lead/', views.GetAllLeads.as_view()),
    path('api/lead/<pk>/', views.GetOneLead.as_view()),  # get single lead
    path('api/lead/<lead_id>/portfolio', views.portfolio_rows_of_lead),  # get portfolio rows of lead
    path('api/lead/fin_instrument/<pk>', views.GetOneInstrument.as_view()),  # get single fin_instrument


    path('api/lead/auth/', include('rest_auth.urls')),
    path('api/lead/auth/register/', include('rest_auth.registration.urls'))
]
