from .models import UserXP, Power, UserPower, UserHintUsage
from domains.models import Level

XP_MAPPING = {
    'easy': 10,
    'medium': 20,
    'hard': 40,
    'expert': 80
}

def add_xp(user, difficulty, multiplier=1):
    """
    Adds mapping-based XP to the user. Creates UserXP profile if missing.
    """
    val = XP_MAPPING.get(difficulty.lower(), 0) * multiplier
    user_xp, created = UserXP.objects.get_or_create(user=user)
    user_xp.xp += int(val)
    user_xp.save()
    return user_xp.xp

def deduct_xp(user, amount):
    """
    Deducts XP from the user. Returns True if successful.
    """
    user_xp, created = UserXP.objects.get_or_create(user=user)
    if user_xp.xp >= amount:
        user_xp.xp -= amount
        user_xp.save()
        return True
    return False

def use_hint(user, level_id):
    """
    Unlocks the next hint for a level. Deducts XP if needed.
    """
    level = Level.objects.get(id=level_id)
    usage, created = UserHintUsage.objects.get_or_create(user=user, level=level)
    
    # Check if there are more hints to unlock
    hint_count = level.hints.count()
    if usage.hints_used >= hint_count:
        return {"status": "error", "message": "All hints already unlocked!"}

    # Use "Reveal Hint" power if available
    reveal_power = Power.objects.filter(name="Reveal Hint").first()
    user_power = None
    if reveal_power:
        user_power = UserPower.objects.filter(user=user, power=reveal_power, quantity__gt=0).first()

    if user_power:
        user_power.quantity -= 1
        user_power.save()
    else:
        # Deduct 5 XP for regular hint unlock
        if not deduct_xp(user, 5):
            return {"status": "error", "message": "Not enough XP to unlock hint (costs 5 XP)!"}

    usage.hints_used += 1
    usage.save()
    
    unlocked_hint = level.hints.get(order=usage.hints_used)
    return {
        "status": "success", 
        "hints_used": usage.hints_used,
        "hint_content": unlocked_hint.content
    }

def use_power(user, power_id, domain_id=None):
    """
    Uses a power and applies its effect.
    """
    user_power = UserPower.objects.get(user=user, power_id=power_id)
    if user_power.quantity <= 0:
        return {"status": "error", "message": f"You don't have any {user_power.power.name}!"}

    power_name = user_power.power.name
    
    if power_name == "Skip Level":
        # Handled in API view with progress/services.complete_level (no XP)
        pass 
    elif power_name == "Double XP":
        # Set a flag in session or UserProgress (handled in API view)
        pass
    elif power_name == "Reveal Hint":
        # Handled in use_hint logic
        pass

    user_power.quantity -= 1
    user_power.save()
    return {"status": "success", "power_name": power_name}

def get_leaderboard_data(limit=100):
    """
    Fetches users ranked by XP.
    Primary sort: XP (DESC)
    Secondary sort: User ID (ASC) for consistent tie-breaking.
    """
    profiles = UserXP.objects.select_related('user').order_by('-xp', 'user_id')[:limit]
    
    leaderboard = []
    for index, profile in enumerate(profiles):
        leaderboard.append({
            'rank': index + 1,
            'username': profile.user.username,
            'xp': profile.xp,
            'user_id': profile.user.id
        })
    return leaderboard

