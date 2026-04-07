from typing import List, Dict
from core.constants import DOMAINS, DIFFICULTY_LEVELS

class LevelEngine:
    @staticmethod
    def get_difficulty_for_level(level: int) -> str:
        """
        Maps level number to difficulty.
        Level 1-10: Easy
        Level 11-30: Medium
        Level 31-100: Hard
        """
        if level <= 10:
            return "easy"
        elif level <= 30:
            return "medium"
        else:
            return "hard"

    @staticmethod
    def is_locked(user_progress: Dict, level: int) -> bool:
        """
        Calculates if a level is currently locked.
        A level is unlocked if it's less than or equal to current_level.
        """
        return level > user_progress.get("current_level", 1)


class MapBuilder:
    @staticmethod
    def build_map(user_id: str, progress: Dict, domain: str = "dsa") -> List[Dict]:
        """
        Builds a map overview of all levels.
        Each level shows: number, locked status, stars earned, mystery title, rewards potential.
        """
        levels = []
        
        # Display 20 levels at a time (e.g., current level center)
        # For simplicity, 100 levels here.
        for i in range(1, 101):
            level_difficulty = LevelEngine.get_difficulty_for_level(i)
            is_locked = LevelEngine.is_locked(progress, i)
            
            # 🏗️ Mechanical Archetypes
            node_type = "standard"
            if i % 10 == 0:
                node_type = "apex"
            elif i % 5 == 0:
                node_type = "guardian"
            
            level_data = {
                "level": i,
                "locked": is_locked,
                "difficulty": level_difficulty,
                "stars": progress.get("stars", {}).get(f"level_{i}", 0),
                "domain": domain,
                "node_type": node_type
            }
            
            levels.append(level_data)
            
        return levels
