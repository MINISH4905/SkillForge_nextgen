from django.urls import path
from . import views

app_name = 'rewards'

urlpatterns = [
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
]
