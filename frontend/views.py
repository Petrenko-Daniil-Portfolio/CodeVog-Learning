from django.shortcuts import render

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect

from leads.models import Lead

from django.http import HttpResponse
# Create your views here.


def index(request):
    context = {}
    if request.method == 'POST':
        email = request.POST['email']
        password = request.POST['password']
        user = Lead.objects.get(email=email, password=password)
        if user is not None:
            login(request, user)



            is_fin_advisor = Lead.objects.values_list('is_staff').get(email=email)

            if is_fin_advisor == True:
                return render(request, '/frontend/user_page.html', context)
            else:
                return render(request, '/frontend/user_page.html', context)

        else:
            context['login'] = "Invalid login"

    return render(request, 'frontend/index.html', context)


def logout_user(request):
    logout(request)
    redirect('home')
