from db import db_manager


def is_duplicate(domain: str, new_task: dict) -> bool:
    existing_tasks = db_manager.load(domain)

    new_title = new_task.get("title", "").strip().lower()
    new_desc = new_task.get("description", "").strip().lower()

    for task in existing_tasks:
        existing_title = task.get("title", "").strip().lower()
        existing_desc = task.get("description", "").strip().lower()

        # 🔥 1. Exact title match
        if existing_title == new_title:
            return True

        # 🔥 2. Description similarity (basic check)
        if new_desc and existing_desc:
            if new_desc[:100] == existing_desc[:100]:
                return True

        # 🔥 3. Partial overlap check (stronger)
        if new_title in existing_title or existing_title in new_title:
            return True

    return False