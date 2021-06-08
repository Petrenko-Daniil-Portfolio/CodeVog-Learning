from django.shortcuts import redirect
from django.http import HttpResponse


def allowed_users(allowed_groups=[]):
    def decorator(view_func):
        def wrapper_func(request, *args, **kwargs):
            if request.user.groups.exists():
                groups = request.user.groups.all()
                for group in groups:
                    for allowed_group in allowed_groups:
                        if str(group) == allowed_group:
                            return view_func(request, *args, **kwargs)
                            break

            return HttpResponse("You do not have proper permissions")

        return wrapper_func
    return decorator

