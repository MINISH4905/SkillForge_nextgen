import json

from core.constants import DOMAINS

_DOMAIN_CONTEXT = {
    "dsa": "data structures and algorithms, arrays, linked lists, string manipulation",
    "frontend": "frontend logic, string parsing, DOM-like transformations in Python",
    "backend": "backend business logic, data validation, system rules",
    "sql": "relational database logic, queries returning computed results",
    "cs_fundamentals": "computer science basics, bitwise, math, memory simulation"
}

def build_prompt(domain: str, difficulty: str, level: int, is_retry: bool = False, history: list = None) -> str:
    if domain not in DOMAINS:
        raise ValueError(f"Invalid domain: {domain}")

    context = _DOMAIN_CONTEXT.get(domain, domain)

    retry_msg = ""
    if is_retry:
        retry_msg = "CRITICAL: YOUR LAST OUTPUT WAS INVALID. DO NOT OUTPUT ANY TEXT OUTSIDE THE JSON BLOCK. AVOID TRIPLE QUOTES IN STRINGS."

    return f"""
{retry_msg}
You are a task generator for a coding game. Generate EXACTLY ONE coding task.

CONTEXT:
Domain: {domain}
Focus: {context}
Difficulty: {difficulty}
Level: {level}

TASK FORMAT: Provide a Python function `def solve(...):` that has ONE logical bug.
Provide a corrected `solution` function.
Provide 2 `test_cases`.

OUTPUT FORMAT MUST BE STRICT JSON. NO MARKDOWN. NO COMMENTS OUTSIDE JSON.

{{
  "title": "A short, unique title",
  "description": "Explain the task simply in 3 lines. Example: solve([1,2]) -> 2\\nUse \\n for newlines.",
  "difficulty": "{difficulty}",
  "level": {level},
  "base_code": "def solve(nums):\\n    # Your buggy code here\\n    return nums",
  "solution": "def solve(nums):\\n    # Correct code here\\n    return sum(nums)",
  "test_cases": {{
    "case1": {{
      "input": [[1, 2]],
      "output": 3
    }},
    "case2": {{
      "input": [[5, 5]],
      "output": 10
    }}
  }},
  "xp_reward": 50,
  "coin_reward": 10,
  "domain": "{domain}"
}}

Generate ONLY the JSON object. Do not include markdown ticks (```).
"""