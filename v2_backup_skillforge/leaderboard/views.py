from django.shortcuts import render
from django.db.models import Sum
from accounts.models import Profile

def leaderboard_view(request):
    # Annotate profiles with the total stars earned from completed tasks
    # We sum the 'stars' field from the UserTask model for each user
    profiles = Profile.objects.select_related('user').annotate(
        total_stars=Sum('user__tasks__stars')
    ).order_by('-level', '-xp')[:50]

    return render(request, 'leaderboard/leaderboard.html', {
        'profiles': profiles
    })