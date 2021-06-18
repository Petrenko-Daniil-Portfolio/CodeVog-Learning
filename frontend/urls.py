from django.urls import path
from . import views


urlpatterns = [
    path('', views.index, name='home'),
    path('user/<user_name>', views.user_view, name='user_page'),
    path('fin_advisor/<user_name>', views.fin_advisor_view, name='fin_adviser_page'),
    path('logout/', views.logout_user, name='logout')
]
