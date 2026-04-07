from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('level/', views.get_level, name='get_level'),
    path('complete/', views.complete_current_level, name='complete_level'),
    path('evaluate/', views.evaluate_current_level, name='evaluate_level'),
    path('progress/', views.get_progress, name='get_progress'),
    path('leaderboard/', views.get_leaderboard, name='get_leaderboard'),
    path('hints/', views.get_hints, name='get_hints'),
    path('use-hint/', views.unlock_hint, name='unlock_hint'),
    path('use-power/', views.apply_power, name='apply_power'),
    path('user-powers/', views.get_user_powers, name='get_user_powers'),

]
