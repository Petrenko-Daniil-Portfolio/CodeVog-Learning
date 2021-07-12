from django.contrib import admin

from leads.models import *

# Register your models here.


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    def render_change_form(self, request, context, *args, **kwargs):
        context['adminform'].form.fields['fin_advisor'].queryset = Lead.objects.filter(is_staff=True)
        return super(LeadAdmin, self).render_change_form(request, context, *args, **kwargs)


@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'symbol', 'currency')


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('instrument', 'quantity')
    list_display_links = None


@admin.register(TimeSeriesData)
class TimeSeriesDataAdmin(admin.ModelAdmin):
    # list_display = ('date', 'close_price', 'instrument')
    list_display = ('instrument', 'close_price', 'date')


@admin.register(PortfolioOperations)
class PortfolioOperationsAdmin(admin.ModelAdmin):
    list_display = ('lead', 'operation', 'instrument', 'old_quantity', 'new_quantity', 'timestamp')

