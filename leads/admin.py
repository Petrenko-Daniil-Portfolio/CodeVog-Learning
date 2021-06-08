from django.contrib import admin

from leads.models import Lead

# Register your models here.


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    def render_change_form(self, request, context, *args, **kwargs):
        context['adminform'].form.fields['fin_advisor'].queryset = Lead.objects.filter(is_staff=True)
        return super(LeadAdmin, self).render_change_form(request, context, *args, **kwargs)



