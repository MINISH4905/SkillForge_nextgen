import logging
from db import db_manager
from .reward_engine import RewardEngine

logger = logging.getLogger(__name__)

class ProgressManager:
    @staticmethod
    def get_progress(user_id: str):
        return db_manager.get_user_progress(user_id)

    @staticmethod
    def update_progress(user_id: str, level_num: int, passed: int, total: int, difficulty: str):
        """
        Updates user progress after a code evaluation.
        """
        progress = db_manager.get_user_progress(user_id)
        
        # Calculate performance
        stars = RewardEngine.calculate_stars(passed, total)
        xp_earned, coins_earned = RewardEngine.calculate_rewards(stars, difficulty, level_num)
        
        # Update user totals
        progress["xp"] += xp_earned
        progress["coins"] += coins_earned
        
        # Track stars per level (keep highest score)
        level_key = f"level_{level_num}"
        prev_stars = progress["stars"].get(level_key, 0)
        
        if stars > prev_stars:
            progress["stars"][level_key] = stars
        
        # Unlock next level if criteria met (e.g., at least 1 star)
        next_level_unlocked = False
        if stars >= 1:
            # Only advance current_level if it's the highest level completed
            if level_num == progress["current_level"]:
                progress["current_level"] += 1
                next_level_unlocked = True
        
        # Save persistence
        db_manager.save_user_progress(user_id, progress)
        
        return {
            "user_id": user_id,
            "stars": stars,
            "xp_earned": xp_earned,
            "coins_earned": coins_earned,
            "level_completed": level_num,
            "next_level_unlocked": next_level_unlocked,
            "total_xp": progress["xp"],
            "total_coins": progress["coins"],
            "current_unlocked_level": progress["current_level"]
        }
