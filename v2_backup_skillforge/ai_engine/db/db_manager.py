import json
import logging
import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict

from core.constants import DOMAIN_FILE_MAP, DOMAINS, BASE_DIR

logger = logging.getLogger(__name__)


# 🔍 Validate domain
def _validate_domain(domain: str) -> None:
    if domain not in DOMAINS:
        raise ValueError(f"Invalid domain '{domain}'. Must be one of: {DOMAINS}")


# 📂 Ensure file exists
def _ensure_file(path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)

    if not os.path.exists(path):
        with open(path, "w") as f:
            json.dump([], f)
        logger.info(f"Created domain file: {path}")


# 📥 Load tasks
def load(domain: str) -> List[Dict]:
    _validate_domain(domain)

    path = DOMAIN_FILE_MAP[domain]
    _ensure_file(path)

    try:
        with open(path, "r") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []

    except json.JSONDecodeError:
        logger.warning(f"Corrupt JSON in {path}, resetting file.")
        save(domain, [])
        return []


# 📤 Save tasks
def save(domain: str, data: List[Dict]) -> None:
    _validate_domain(domain)

    path = DOMAIN_FILE_MAP[domain]
    _ensure_file(path)

    with open(path, "w") as f:
        json.dump(data, f, indent=2)

    logger.info(f"Saved {len(data)} tasks to domain '{domain}'.")


# ➕ Add task (ENHANCED)
def add_task(domain: str, task: Dict) -> Dict:
    _validate_domain(domain)

    tasks = load(domain)

    # 🔥 Prevent duplicates (extra safety)
    new_title = task.get("title", "").strip().lower()
    for t in tasks:
        if t.get("title", "").strip().lower() == new_title:
            logger.warning(f"Duplicate task detected: {new_title}")
            return t

    # 🆔 Add unique ID (if not provided)
    if "id" not in task or not task["id"] or task["id"] == "UUID_STRING":
        task["id"] = str(uuid.uuid4())

    # 🕒 Add timestamp
    task["created_at"] = datetime.utcnow().isoformat()

    # 🔥 Ensure domain
    task["domain"] = domain

    # ✅ Ensure required game fields exist (fallback safety)
    task.setdefault("base_code", "def solve():\n    # Fix the bug\n    pass")
    task.setdefault("solution", "")
    task.setdefault("test_cases", {})
    task.setdefault("xp_reward", 50)
    task.setdefault("coin_reward", 10)

    tasks.append(task)
    save(domain, tasks)

    logger.info(f"Added task '{task.get('title')}' to domain '{domain}'.")

    return task


# 🔍 Get task by ID
def get_task_by_id(task_id: str) -> Optional[Dict]:
    for domain in DOMAINS:
        tasks = load(domain)
        for t in tasks:
            if t.get("id") == task_id:
                return t
    return None


# 📜 Get recent titles (for Prompt History)
def get_recent_titles(domain: str, limit: int = 10) -> List[str]:
    tasks = load(domain)
    # Take the last 'limit' tasks
    recent = tasks[-limit:] if tasks else []
    return [t.get("title") for t in recent if t.get("title")]


# 🎮 User Progress Management
PROGRESS_FILE = BASE_DIR / "db" / "user_progress.json"


def get_user_progress(user_id: str) -> Dict:
    # Ensure the parent directory exists
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)

    if not os.path.exists(PROGRESS_FILE):
        return {
            "user_id": user_id,
            "current_level": 1,
            "xp": 0,
            "coins": 0,
            "stars": {}
        }

    try:
        with open(PROGRESS_FILE, "r") as f:
            data = json.load(f)
            if not isinstance(data, dict):
                data = {}
            
            return data.get(user_id, {
                "user_id": user_id,
                "current_level": 1,
                "xp": 0,
                "coins": 0,
                "stars": {}
            })

    except (json.JSONDecodeError, FileNotFoundError):
        return {
            "user_id": user_id,
            "current_level": 1,
            "xp": 0,
            "coins": 0,
            "stars": {}
        }


def save_user_progress(user_id: str, progress: Dict) -> None:
    # Ensure the parent directory exists
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)

    try:
        if os.path.exists(PROGRESS_FILE):
            with open(PROGRESS_FILE, "r") as f:
                data = json.load(f)
                if not isinstance(data, dict):
                    data = {}
        else:
            data = {}
    except (json.JSONDecodeError, FileNotFoundError):
        data = {}

    data[user_id] = progress

    with open(PROGRESS_FILE, "w") as f:
        json.dump(data, f, indent=2)


# 🔄 Reset
def reset(domain: Optional[str] = None) -> Dict:
    targets = [domain] if domain else DOMAINS

    for d in targets:
        _validate_domain(d)
        save(d, [])
        logger.info(f"Reset domain '{d}'.")

    return {
        "status": "success",
        "reset_domains": targets,
        "total": len(targets)
    }