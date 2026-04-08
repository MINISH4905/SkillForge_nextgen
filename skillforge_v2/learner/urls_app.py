from django.urls import path
from . import views

urlpatterns = [
    # Profile & Domains
    path('profile/', views.get_profile, name='get_profile'),
    path('domains/', views.get_domains, name='get_domains'),

    # Quest
    path('quest/next/', views.get_next_quest, name='get_next_quest'),
    path('quest/task/<int:task_id>/', views.get_task, name='get_task'),
    path('quest/start/<int:task_id>/', views.start_quest, name='start_quest'),
    path('quest/evaluate/<int:session_id>/', views.evaluate_quest, name='evaluate_quest'),

    # Remediation
    path('remediation/plan/', views.get_remediation_plan, name='get_remediation_plan'),
    path('remediation/plan/reset/', views.reset_remediation_plan, name='reset_remediation_plan'),
    path('remediation/plan/progress/', views.get_remediation_progress, name='get_remediation_progress'),
    path('remediation/day/<int:day_number>/', views.get_remediation_day, name='get_remediation_day'),
    path('remediation/day/<int:day_number>/complete/', views.complete_remediation_day, name='complete_remediation_day'),
]
