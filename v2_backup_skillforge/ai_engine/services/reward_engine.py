import math

class RewardEngine:
    @staticmethod
    def calculate_stars(passed: int, total: int) -> int:
        if total == 0:
            return 0
        
        percentage = (passed / total) * 100
        
        if percentage >= 100:
            return 3
        elif percentage >= 70:
            return 2
        elif percentage >= 40:
            return 1
        else:
            return 0

    @staticmethod
    def calculate_rewards(stars: int, difficulty: str, level: int):
        # Base rewards
        base_xp = 50 + (level * 5)
        base_coins = 10 + level
        
        # Multipliers based on performance
        star_multipliers = {
            3: 1.0,    # 100% of base
            2: 0.7,    # 70% of base
            1: 0.4,    # 40% of base
            0: 0.0     # Fail
        }
        
        # Difficulty multipliers
        diff_multipliers = {
            "easy": 1.0,
            "medium": 1.5,
            "hard": 2.0
        }
        
        multiplier = star_multipliers.get(stars, 0)
        diff_mult = diff_multipliers.get(difficulty.lower(), 1.0)
        
        xp_earned = math.floor(base_xp * multiplier * diff_mult)
        coins_earned = math.floor(base_coins * multiplier * diff_mult)
        
        return xp_earned, coins_earned
