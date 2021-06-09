from django.shortcuts import render

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect

from leads.models import Lead

from django.http import HttpResponse

from django.contrib.auth.decorators import login_required
from .decorators import allowed_users

# Create your views here.


def index(request):
    context = {}
    if request.method == 'POST':
        email = request.POST['email']
        password = request.POST['password']
        try:
            user = Lead.objects.get(email=email, password=password)
            login(request, user)
            return redirect('user_page', user_name=user.email)

        except:

            user = authenticate(email=email, password=password)
            login(request, user)
            if user is not None:
                return redirect('fin_adviser_page', user_name=user.email)
            else:
                context['login'] = "Invalid login"

    return render(request, 'frontend/index.html', context)


def logout_user(request):
    logout(request)
    redirect('home')


@allowed_users(allowed_groups=['fin_advisor', 'lead'])
def user_view(request, user_name):
    if not request.user.is_authenticated:
        redirect('home')

    return HttpResponse("Yes you are authenticated")

