from django.contrib import admin

from .models import Lead
# Register your models here.



@admin.register(Lead)
class FinAdviser(admin.ModelAdmin):
    def render_change_form(self, request, context, *args, **kwargs):
         context['adminform'].form.fields['fin_advisor'].queryset = Lead.objects.filter(is_staff=True)
         return super(FinAdviser, self).render_change_form(request, context, *args, **kwargs)

