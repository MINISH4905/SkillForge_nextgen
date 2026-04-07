from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import UserXP
from .services import get_leaderboard_data
from django.db.models import Q

class LeaderboardView(LoginRequiredMixin, TemplateView):
    template_name = 'rewards/leaderboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Fetch top 100 for display
        leaderboard = get_leaderboard_data(limit=100)
        
        # Get current user's rank even if not in top 100
        user_xp_record, created = UserXP.objects.get_or_create(user=self.request.user)
        user_rank = None
        
        # Check if user is in the top 100 list
        for entry in leaderboard:
            if entry['user_id'] == self.request.user.id:
                user_rank = entry['rank']
                break
        
        # If not, calculate dynamically
        if not user_rank:
            higher_xp_count = UserXP.objects.filter(
                Q(xp__gt=user_xp_record.xp) | 
                Q(xp=user_xp_record.xp, user_id__lt=user_xp_record.user_id)
            ).count()
            user_rank = higher_xp_count + 1
            
        context['leaderboard'] = leaderboard
        context['user_rank'] = user_rank
        context['user_xp_record'] = user_xp_record
        return context
