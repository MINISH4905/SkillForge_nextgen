from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import LearnerProfile, LearnerGoal
from domains.models import Domain, Level
from progress.models import UserProgress
from rewards.models import UserXP, UserBadge

@login_required
def learner_dashboard(request):
    # Get user progress across all domains
    progresses = UserProgress.objects.filter(user=request.user)
    
    # Get total XP and rank
    try:
        user_xp_obj = request.user.xp_profile
        total_xp = user_xp_obj.xp
    except:
        total_xp = 0
    
    # Simple rank calculation (could be more complex)
    rank = UserXP.objects.filter(xp__gt=total_xp).count() + 1
    
    # Active goals
    goals = LearnerGoal.objects.filter(user=request.user, is_completed=False)
    
    # Recent badges
    badges = UserBadge.objects.filter(user=request.user).order_by('-awarded_at')[:5]
    
    context = {
        'total_xp': total_xp,
        'rank': rank,
        'progresses': progresses,
        'goals': goals,
        'badges': badges,
        'profile': request.user.learner_profile,
    }
    return render(request, 'learner/dashboard.html', context)

@login_required
def profile_settings(request):
    profile = request.user.learner_profile
    if request.method == 'POST':
        profile.bio = request.POST.get('bio')
        profile.github_url = request.POST.get('github_url')
        profile.linkedin_url = request.POST.get('linkedin_url')
        preferred_domain_id = request.POST.get('preferred_domain')
        if preferred_domain_id:
            profile.preferred_domain = Domain.objects.get(id=preferred_domain_id)
        profile.save()
        return redirect('learner:dashboard')
    
    domains = Domain.objects.all()
    return render(request, 'learner/profile_settings.html', {'profile': profile, 'domains': domains})

@login_required
def add_goal(request):
    if request.method == 'POST':
        domain_id = request.POST.get('domain')
        target_level = request.POST.get('target_level')
        domain = get_object_or_404(Domain, id=domain_id)
        LearnerGoal.objects.create(
            user=request.user,
            domain=domain,
            target_level=target_level
        )
    return redirect('learner:dashboard')
