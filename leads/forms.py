from django import forms

from .models import Lead


class LeadForm(forms.ModelForm):
    fin_advisor = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput())

    class Meta:
        model = Lead
        fields = [
            'email', 'fin_advisor',  # this two field are auto set and can not be changed by lead
            'username', 'password',  'image'     # all other fields
        ]

    def __init__(self, *args, **kwargs):

        if 'email' in kwargs and 'fin_advisor' in kwargs:
            email = kwargs.pop('email')
            advisor = kwargs.pop('fin_advisor')
            super(LeadForm, self).__init__(*args, **kwargs)
            self.fields['email'].initial = email
            self.fields['fin_advisor'].initial = advisor
        else:
            super(LeadForm, self).__init__(*args, **kwargs)

        self.fields['email'].widget.attrs['readonly'] = True

        self.fields['fin_advisor'].widget.attrs['readonly'] = True

        # set widgets with styles
        self.fields['password'].widget.attrs['class'] = 'form-control mt-3'

        self.fields['email'].widget.attrs['class'] = 'form-control mt-3'
        self.fields['fin_advisor'].widget.attrs['class'] = 'form-control mt-3'
        self.fields['username'].widget.attrs['class'] = 'form-control mt-3'
        self.fields['image'].widget.attrs['class'] = 'form-control mt-3 btn btn-success'

    def clean(self):
        cleaned_data = super().clean()

        advisor_email = cleaned_data.get('fin_advisor')
        cleaned_data['fin_advisor'] = Lead.objects.get(email=advisor_email)
