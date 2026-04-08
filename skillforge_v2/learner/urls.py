from django.urls import path, include
from django.views.generic import TemplateView

app_name = 'learner'

urlpatterns = [
    # REST API — strictly following the /api/v1/learner/ path from api.js
    path('api/v1/learner/', include('learner.urls_app')),

    # Frontend — serve index.html for any other path (SPA catch-all)
    path('', TemplateView.as_view(template_name='learner/index.html'), name='dashboard'),
]
