from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from .forms import RegisterForm, LoginForm, ProfileForm
from django.contrib.auth.decorators import login_required

def register_view(request):
    form = RegisterForm(request.POST or None)

    if form.is_valid():
        user = form.save(commit=False)
        user.set_password(form.cleaned_data['password'])
        user.save()
        login(request, user)
        return redirect('dashboard')

    return render(request, 'accounts/register.html', {'form': form})


def login_view(request):
    form = LoginForm(request, data=request.POST or None)

    if form.is_valid():
        login(request, form.get_user())
        return redirect('dashboard')

    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('login')


from django.db.models import Count
# from game.models import UserTask # TEMPORARILY DISABLED

@login_required
def dashboard_view(request):
    user = request.user
    profile = user.profile
    
    # 📈 Domain Statistics (Tasks solved per domain)
    # We count how many 'completed' tasks the user has in each domain
    domain_stats = []
    
    # Map domain results to a cleaner dictionary for the template
    stats = {item['task__domain'].upper(): item['total'] for item in domain_stats}
    
    # 🕒 Recent Activity (Last 5 solved tasks)
    recent_activity = []

    # 📊 Domain Mastery (Pre-calculated for template)
    domains = ['DSA', 'FRONTEND', 'BACKEND', 'SQL']
    domain_mastery = []
    for d in domains:
        count = stats.get(d, 0)
        domain_mastery.append({
            'name': d,
            'count': count,
            'pct': min(int(count * 10), 100) # 10 tasks = 100% mastery
        })

    # Calculate progress to next level
    next_level_threshold = (profile.level) * 100
    progress_pct = min(int((profile.xp / next_level_threshold) * 100), 100) if next_level_threshold > 0 else 0
    
    return render(request, 'accounts/dashboard.html', {
        'profile': profile,
        'progress_pct': progress_pct,
        'next_level_threshold': next_level_threshold,
        'domain_mastery': domain_mastery,
        'recent_activity': recent_activity
    })

@login_required
def profile_view(request):
    profile = request.user.profile

    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('dashboard')
    else:
        form = ProfileForm(instance=profile)

    return render(request, 'accounts/profile.html', {'form': form})