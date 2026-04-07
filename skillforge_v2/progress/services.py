from .models import UserProgress
from domains.models import Level
from rewards.services import add_xp

def get_current_level(user, domain):
    """
    Fetches user's current level index for a domain and returns the corresponding Level object.
    Creates progress tracking automatically if it doesn't exist.
    """
    progress, created = UserProgress.objects.get_or_create(user=user, domain=domain)
    
    try:
        return Level.objects.get(domain=domain, level_number=progress.current_level)
    except Level.DoesNotExist:
        # User might have completed all 100 levels!
        return None

def complete_level(user, domain, xp_multiplier=1, award_xp=True):
    """
    Increments user's level by 1 and awards XP.
    """
    current_level_obj = get_current_level(user, domain)
    if not current_level_obj:
        return False # No level found or already completed all

    # 1. Add XP (only if award_xp is True)
    if award_xp:
        add_xp(user, current_level_obj.difficulty, multiplier=xp_multiplier)

    # 2. Increment Level
    progress = UserProgress.objects.get(user=user, domain=domain)
    if progress.current_level < 100:
        progress.current_level += 1
        progress.save()
    
    return True

