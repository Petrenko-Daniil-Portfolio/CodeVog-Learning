from django.urls import include, path
from leads import views
from leads import send_info

urlpatterns = [
    path('api/lead/', views.GetAllLeads.as_view()),
    path('api/lead/<int:pk>/', views.GetOneLead.as_view()),  # get single lead
    path('api/lead/<lead_id>/portfolio', views.portfolio_rows_of_lead),  # get portfolio rows of lead

    path('api/fin_instrument/', views.GetAllInstruments.as_view()),  # create instruments
    path('api/fin_instrument/<pk>', views.GetOneInstrument.as_view()),  # get single fin_instrument

    path('api/portfolio/', views.PortfolioCreateView.as_view()),  # create portfolio
    path('api/portfolio/<pk>', views.PortfolioView.as_view()),

    path('api/time_series_data/', views.TimeSeriesDataView.as_view()),  # time series data

    path('api/time_series/', views.time_series),  # create time series for one instrument

    path('api/portfolio_value', views.portfolio_value),  # get portfolio value data (it uses POST method)
    path('api/portfolio_values/<advisor_id>', views.portfolio_values_of_advisor),  # get portfolio values of all advisor`s leads

    path('api/send_email/', send_info.create_operation),  # create operation that will be send to user due to celery schedule
    path('api/send_invitation/', send_info.create_invitation),  # create and send invitation to became lead of advisor

    path('api/lead/auth/', include('rest_auth.urls')),
    path('api/lead/auth/register/', include('rest_auth.registration.urls')),


    path('test', views.test_view)  # test view to check if things work
]
