from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('rewards/', include('rewards.urls')),
    path('api/', include('api.urls')),
    
    # Leaderboard shortcut
    path('leaderboard/', include('rewards.urls')),

    # Root redirects to dashboard
    path('', RedirectView.as_view(url='/dashboard/')),
]
