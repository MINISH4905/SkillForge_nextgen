from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rewards import views as reward_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('rewards/', include('rewards.urls')),
    path('api/', include('api.urls')),
    path('learner/', include('learner.urls')),
    
    # Leaderboard shortcut
    path('leaderboard/', reward_views.LeaderboardView.as_view(), name='leaderboard'),

    # Root redirects to login
    path('', RedirectView.as_view(url='/accounts/login/')),
]
