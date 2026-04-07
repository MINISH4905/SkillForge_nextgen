# core/constants.py

from pathlib import Path

# 🔥 Base directory (ai_engine root)
BASE_DIR = Path(__file__).resolve().parent.parent

# 🎯 Supported Domains
DOMAINS = [
    "dsa",
    "frontend",
    "backend",
    "sql",
    "cs_fundamentals"
]

# 📂 Domain File Mapping
DOMAIN_FILE_MAP = {
    "dsa": BASE_DIR / "db" / "domains" / "dsa.json",
    "frontend": BASE_DIR / "db" / "domains" / "frontend.json",
    "backend": BASE_DIR / "db" / "domains" / "backend.json",
    "sql": BASE_DIR / "db" / "domains" / "sql.json",
    "cs_fundamentals": BASE_DIR / "db" / "domains" / "cs_fundamentals.json",
}

# 🎚️ Difficulty Levels (STRICT CONTROL)
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

# 🎮 Level Constraints (Gamification Ready)
MIN_LEVEL = 1
MAX_LEVEL = 100

# ⚙️ LLM Settings
DEFAULT_TEMPERATURE = 0.7
MAX_RETRIES = 5

# 🧠 Prompt Rules
MIN_DESCRIPTION_LINES = 3
MAX_DESCRIPTION_LINES = 5

# 📦 Required Task Fields
REQUIRED_TASK_KEYS = ["title", "description", "difficulty", "level", "domain"]

# 🚫 Error Messages
INVALID_DOMAIN_ERROR = "Invalid domain provided"
INVALID_DIFFICULTY_ERROR = "Invalid difficulty level"
INVALID_LEVEL_ERROR = "Level must be between 1 and 100"
GENERATION_FAILED_ERROR = "Failed to generate unique task after retries"
INVALID_RESPONSE_ERROR = "Invalid response from LLM"