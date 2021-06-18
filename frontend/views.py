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

        user = authenticate(email=email, password=password)

        if user is None:
            context['login'] = "Invalid login"
        else:
            login(request, user)
            if user.is_staff:
                return redirect('fin_adviser_page', user_name=user.email)

            return redirect('user_page', user_name=user.email)

        # try:
        #     user = Lead.objects.get(email=email, password=password)
        #     login(request, user)
        #     return redirect('user_page', user_name=user.email)
        #
        # except:
        #     user = authenticate(email=email, password=password)
        #     login(request, user)
        #     if user is not None:
        #         return redirect('fin_adviser_page', user_name=user.email)
        #     else:
        #

    return render(request, 'frontend/index.html', context)


def logout_user(request):
    logout(request)
    redirect('home')


@allowed_users(allowed_groups=['fin_advisor', 'lead'])
def user_view(request, user_name):
    # if not request.user.is_authenticated:
    #     redirect('home')

    lead = Lead.objects.get(email=request.user)

    context = {
        'email': lead.email,
        'user_name': lead.username,
        'fin_instruments': [],  # no fin instruments in DB yet
    }

    return render('request', 'frontend/fin_instruments.html', context)


@allowed_users(allowed_groups=['fin_advisor'])
def fin_advisor_view(request, user_name):
    fin_advisor = Lead.objects.get(email=request.user)

    leads = Lead.objects.filter(fin_advisor=fin_advisor).all()

    return render(request, 'frontend/fin_advisor.html')

