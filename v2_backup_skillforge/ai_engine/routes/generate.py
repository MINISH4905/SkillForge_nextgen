from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services import generator
from core.constants import DOMAINS, DIFFICULTY_LEVELS, MIN_LEVEL, MAX_LEVEL
from db import db_manager

router = APIRouter()


# ✅ Request Models
class TaskRequest(BaseModel):
    domain: str
    difficulty: str
    level: int


class HintRequest(BaseModel):
    title: str
    domain: str
    current_code: str


class ResetRequest(BaseModel):
    domain: Optional[str] = None


# 🚀 Generate Task
@router.post("/task")
def generate_task(request: TaskRequest):
    try:
        # 🔍 Validation
        if request.domain not in DOMAINS:
            raise HTTPException(status_code=400, detail="Invalid domain")

        if request.difficulty not in DIFFICULTY_LEVELS:
            raise HTTPException(status_code=400, detail="Invalid difficulty")

        if not (MIN_LEVEL <= request.level <= MAX_LEVEL):
            raise HTTPException(status_code=400, detail="Level must be between 1 and 100")

        # ⚡ Generate
        task = generator.generate_task(
            domain=request.domain,
            difficulty=request.difficulty,
            level=request.level
        )

        # 🔥 Ensure domain is always attached
        task["domain"] = request.domain

        return {
            "status": "success",
            "message": "Task generated successfully",
            "data": task
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Task generation failed: {str(e)}"
        )


# 💡 Generate Hint
@router.post("/hint")
def generate_hint(request: HintRequest):
    try:
        if request.domain not in DOMAINS:
            raise HTTPException(status_code=400, detail="Invalid domain")

        hint = generator.generate_hint(
            title=request.title,
            domain=request.domain,
            code=request.current_code
        )

        return {
            "status": "success",
            "message": "Hint generated successfully",
            "hint": hint
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Hint generation failed: {str(e)}"
        )


# 🔥 RESET ENDPOINT
@router.post("/reset")
def reset_data(request: ResetRequest):
    try:
        if request.domain:
            if request.domain not in DOMAINS:
                raise HTTPException(status_code=400, detail="Invalid domain")

            db_manager.reset(request.domain)

            return {
                "status": "success",
                "message": f"{request.domain} domain reset successfully",
                "domain": request.domain
            }

        # 🔥 Reset ALL domains
        db_manager.reset()

        return {
            "status": "success",
            "message": "All domains reset successfully",
            "domain": "all"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Reset failed: {str(e)}"
        )