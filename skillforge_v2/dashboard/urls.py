from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('domain/<int:domain_id>/', views.domain_view, name='domain'),
    path('level/<int:level_id>/', views.level_view, name='level'),
    path('progress/', views.progress_view, name='progress'),
]
