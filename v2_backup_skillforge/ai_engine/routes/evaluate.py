from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.generator import generate_task
from services.progress_manager import ProgressManager
from evaluation.evaluator import evaluate_submission
from db import db_manager

router = APIRouter()


class Submission(BaseModel):
    user_id: str
    code: str
    domain: str
    difficulty: str
    level: int 
    task_id: Optional[str] = None
    dry_run: bool = False


@router.post("/")
def evaluate_code(submission: Submission):
    try:
        # 1. Retrieve task (either by ID or generate for the level)
        if submission.task_id:
            task = db_manager.get_task_by_id(submission.task_id)
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")
        else:
            task = generate_task(submission.domain, submission.difficulty, submission.level)

        # 2. Run evaluation
        evaluation = evaluate_submission(
            submission.code,
            task["test_cases"]
        )

        # 3. Process rewards and progress ONLY if not a dry run
        if not submission.dry_run:
            reward_packet = ProgressManager.update_progress(
                user_id=submission.user_id,
                level_num=submission.level,
                passed=evaluation["passed"],
                total=evaluation["total"],
                difficulty=submission.difficulty
            )

            return {
                "status": "success",
                "task_id": task.get("id"),
                "task_title": task.get("title"),
                "evaluation": evaluation,
                "rewards": {
                    "stars": reward_packet["stars"],
                    "xp_earned": reward_packet["xp_earned"],
                    "coins_earned": reward_packet["coins_earned"],
                    "next_level_unlocked": reward_packet["next_level_unlocked"]
                },
                "user_state": {
                    "total_xp": reward_packet["total_xp"],
                    "total_coins": reward_packet["total_coins"],
                    "current_level": reward_packet["current_unlocked_level"]
                }
            }
        else:
            # DRY RUN: Return evaluation only, no rewards
            return {
                "status": "success",
                "evaluation": evaluation,
                "message": "Dry run complete - no progress recorded."
            }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))