from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from db import db_manager
from services.progress_manager import ProgressManager
from game.level_engine import MapBuilder

router = APIRouter()

class ProgressUpdateRequest(BaseModel):
    user_id: str
    level: int
    passed: int
    total: int
    difficulty: str

@router.get("/{user_id}")
def get_progress(user_id: str):
    """
    Returns user progress, XP, and unlock level for the frontend.
    """
    try:
        progress = ProgressManager.get_progress(user_id)
        
        # Build map overview
        level_map = MapBuilder.build_map(user_id, progress)
        
        return {
            "status": "success",
            "progress": progress,
            "map_state": level_map[:100]  # Show full season (100 levels)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update")
def calculate_and_save_progress(request: ProgressUpdateRequest):
    """
    Updates progress based on evaluation results.
    """
    try:
        result = ProgressManager.update_progress(
            request.user_id,
            request.level,
            request.passed,
            request.total,
            request.difficulty
        )
        
        return {
            "status": "success",
            "reward_data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
