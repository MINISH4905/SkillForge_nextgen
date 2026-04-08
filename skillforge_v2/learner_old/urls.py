from django.urls import path
from . import views

app_name = 'learner'

urlpatterns = [
    path('dashboard/', views.learner_dashboard, name='dashboard'),
    path('profile/settings/', views.profile_settings, name='profile_settings'),
    path('goals/add/', views.add_goal, name='add_goal'),
]
