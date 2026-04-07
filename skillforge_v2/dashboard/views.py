from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from domains.models import Domain, Level
from progress.models import UserProgress
from progress.services import get_current_level

def home_view(request):
    domains = Domain.objects.all()
    return render(request, 'dashboard/home.html', {'domains': domains})

@login_required
def domain_view(request, domain_id):
    domain = get_object_or_404(Domain, pk=domain_id)
    level_obj = get_current_level(request.user, domain)
    
    # Safely get current level number if level obj returns None (all completed)
    progress = UserProgress.objects.filter(user=request.user, domain=domain).first()
    current_level_num = progress.current_level if progress else 1
    
    context = {
        'domain': domain,
        'current_level_obj': level_obj,
        'current_level_num': current_level_num,
        'is_completed': level_obj is None and progress and progress.current_level >= 100
    }
    return render(request, 'dashboard/domain.html', context)

@login_required
def level_view(request, level_id):
    level = get_object_or_404(Level, pk=level_id)
    return render(request, 'dashboard/level.html', {'level': level})

@login_required
def progress_view(request):
    try:
        user_xp = request.user.xp_profile.xp
    except:
        user_xp = 0
        
    progresses = UserProgress.objects.filter(user=request.user)
    badges = request.user.badges.all()
    
    context = {
        'total_xp': user_xp,
        'progresses': progresses,
        'badges': badges
    }
    return render(request, 'dashboard/progress.html', context)
