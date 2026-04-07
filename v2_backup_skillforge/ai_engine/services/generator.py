import json
import logging
import re
import requests
import ast
import uuid
from datetime import datetime

from core.config import settings
from db import db_manager
from services.deduplicator import is_duplicate
from services.prompt_builder import build_prompt
from evaluation.evaluator import evaluate_submission

logger = logging.getLogger(__name__)

# 🔥 UPDATED REQUIRED FIELDS
_REQUIRED_FIELDS = {
    "title",
    "description",
    "difficulty",
    "level",
    "base_code",
    "solution",
    "test_cases",
    "xp_reward",
    "coin_reward"
}


def _call_llm(prompt: str) -> str:
    payload = {
        "model": settings.LOCAL_MODEL_NAME,
        "messages": [
            {"role": "system", "content": "You are a coding task generator."},
            {"role": "user", "content": prompt},
        ],
        "temperature": settings.LLM_TEMPERATURE,
    }

    try:
        response = requests.post(
            settings.LOCAL_LLM_URL,
            json=payload,
            timeout=settings.LLM_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"LLM Call failed: {e}")
        return ""


def _extract_json(raw: str) -> dict:
    """
    Extracts JSON from LLM output with extreme resilience.
    Handles triple quotes, markdown blocks, and conversational noise.
    """
    if not raw:
        return {}

    try:
        # 1. Strip markdown blocks
        clean = re.sub(r"```(?:json|python)?\s*(.*?)\s*```", r"\1", raw, flags=re.DOTALL).strip()
        
        # 2. Find balanced braces
        all_blocks = re.findall(r"(\{.*\})", clean, re.DOTALL)
        if not all_blocks:
            # Try to find anything between { and } if the above fails
            match = re.search(r"\{.*\}", clean, re.DOTALL)
            if match:
                json_str = match.group(0)
            else:
                return {}
        else:
            json_str = all_blocks[-1]

        # 3. 🔥 AGGRESSIVE FIX: Anti-Triple Quote & Delimiter Sanitization
        json_str = json_str.replace('"""', '"').replace("'''", "'")
        # Fix unescaped newlines inside strings if any remain
        # (This is tricky, but basic replacement helps)
        
        # 4. Strategy A: Standard JSON
        try:
            return json.loads(json_str, strict=False)
        except json.JSONDecodeError:
            pass

        # 5. Strategy B: AST Fallback (for single quotes or Python-like dicts)
        try:
            py_str = json_str.replace('true', 'True').replace('false', 'False').replace('null', 'None')
            return ast.literal_eval(py_str)
        except:
            return {}

    except Exception as e:
        logger.error(f"JSON Extraction crashed: {e}")
        return {}


def _get_fallback_task(domain: str, difficulty: str, level: int) -> dict:
    """
    Returns a guaranteed valid, playable task if the AI engine fails.
    Ensures zero downtime for the frontend.
    """
    return {
        "title": f"The Sentinel's Sum (Fallback {level})",
        "description": "The AI Forge is cooling down. Solve this fundamental challenge to proceed.\n\nInput: a list of integers.\nOutput: the sum of all elements.",
        "difficulty": difficulty,
        "level": level,
        "base_code": "def solve(nums):\n    # BUG: Returning 0 instead of sum\n    return 0",
        "solution": "def solve(nums):\n    return sum(nums)",
        "test_cases": {
            "case1": {"input": [[1, 2, 3]], "output": 6},
            "case2": {"input": [[-1, 1, 0]], "output": 0}
        },
        "xp_reward": 10,
        "coin_reward": 5,
        "domain": domain,
        "id": str(uuid.uuid4()),
        "created_at": datetime.utcnow().isoformat()
    }


def _validate_task(task: dict) -> bool:
    if not isinstance(task, dict):
        return False
    
    missing = _REQUIRED_FIELDS - task.keys()
    if missing:
        logger.warning(f"Validation failed: Missing {missing}")
        return False

    # Check structural integrity of test_cases
    tc = task.get("test_cases", {})
    if not isinstance(tc, dict) or "case1" not in tc:
        return False
    
    # Ensure input is always a list for *args passing
    for key, val in tc.items():
        if not isinstance(val.get("input"), (list, tuple)):
            logger.warning(f"Normalization: Test case {key} input was not a list. Wrapping.")
            val["input"] = [val.get("input")]

    return True


def _verify_task_logic(task: dict) -> bool:
    try:
        # Check base_code (MUST FAIL)
        base_results = evaluate_submission(task["base_code"], task["test_cases"])
        if base_results["passed"] == base_results["total"]:
            return False

        # Check solution (MUST PASS)
        sol_results = evaluate_submission(task["solution"], task["test_cases"])
        if sol_results["passed"] < sol_results["total"]:
            return False

        return True
    except Exception:
        return False


def generate_task(domain: str, difficulty: str, level: int) -> dict:
    """
    Generates a task with a 2-stage retry mechanism and fallback safety.
    """
    # 📜 Fetch history of recent titles for this domain to avoid repetition
    history_titles = db_manager.get_recent_titles(domain)
    last_error = None

    for attempt in range(1, 4):  # 3 attempts (1 normal, 2 retries)
        is_retry = attempt > 1
        print(f"⚡ Generation Attempt {attempt} (Retry: {is_retry}) | History: {len(history_titles)}")

        prompt = build_prompt(domain, difficulty, level, is_retry=is_retry, history=history_titles)
        
        try:
            raw = _call_llm(prompt)
            task = _extract_json(raw)

            # Handle possible nested 'data' key
            if "data" in task:
                task = task["data"]

            if not _validate_task(task):
                raise ValueError("Incomplete or malformed JSON structure")

            if not _verify_task_logic(task):
                raise ValueError("Task logic parity check failed")

            if is_duplicate(domain, task):
                raise ValueError("Duplicate task detected")

            # Success! Store and return
            stored = db_manager.add_task(domain, task)
            return stored

        except Exception as e:
            logger.error(f"Attempt {attempt} failed: {e}")
            last_error = e
            continue

    # 🚨 ALL ATTEMPTS FAILED: Trigger Fallback System
    logger.critical(f"Task generation failed after 3 attempts. Delivering Fallback Task. Last Error: {last_error}")
    fallback = _get_fallback_task(domain, difficulty, level)
    
    # Store fallback as well so it's a real task in the history
    try:
        return db_manager.add_task(domain, fallback)
    except:
        return fallback