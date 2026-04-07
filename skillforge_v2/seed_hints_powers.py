import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillforge.settings')
django.setup()

from domains.models import Level, Hint
from rewards.models import Power

def seed_hints_and_powers():
    # 1. Create Powers
    powers_to_create = [
        {
            "name": "Reveal Hint",
            "description": "Unlock the next hint for the current level without spending XP.",
            "cost": 25
        },
        {
            "name": "Skip Level",
            "description": "Move to the next level immediately. You won't receive XP for skipping.",
            "cost": 50
        },
        {
            "name": "Double XP",
            "description": "Double the XP reward for the next level you complete correctly.",
            "cost": 40
        }
    ]

    for p_data in powers_to_create:
        power, created = Power.objects.get_or_create(
            name=p_data["name"],
            defaults={
                "description": p_data["description"],
                "cost": p_data["cost"]
            }
        )
        if created:
            print(f"Created Power: {power.name}")
        else:
            print(f"Power already exists: {power.name}")

    # 2. Create hints for first few levels of each domain
    levels = Level.objects.filter(level_number__lte=5)
    for level in levels:
        # Hint 1
        Hint.objects.get_or_create(
            level=level,
            order=1,
            defaults={"content": f"Think about the core concept of {level.concept}."}
        )
        # Hint 2
        Hint.objects.get_or_create(
            level=level,
            order=2,
            defaults={"content": f"The solution involves using a specific pattern common in {level.domain.name}."}
        )
        # Hint 3
        Hint.objects.get_or_create(
            level=level,
            order=3,
            defaults={"content": f"Try to look at the solution structure: it often starts with a standard initialization."}
        )
    print(f"Seeded hints for {levels.count()} levels.")

if __name__ == "__main__":
    seed_hints_and_powers()
