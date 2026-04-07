# 🔨 SkillForge: AI-Powered Coding Practice Platform

SkillForge is a full-stack, production-grade coding platform designed to provide an **infinite, gamified coding experience**. It uses a dual-service architecture with a secure Django frontend and a FastAPI-powered AI Engine that dynamically generates unique coding challenges across five distinct domains.

---

## 🏛️ Architecture

SkillForge strictly adheres to a robust microservice design pattern:

-   **Frontend & Core Business Logic (Django - Port 8000)**: Hands all user authentication, the Forge IDE UI, progress tracking, dashboards, and leaderboard rankings. SQLite persists user profiles and task statuses.
-   **AI Evaluation Engine (FastAPI - Port 8001)**: A dedicated, stateless microservice responsible for generating unique tasks utilizing a local LLM, maintaining domain memory to prevent repetition, and executing user code in a secure sandbox evaluation pipeline.

---

## 🚀 Core Features

-   **Infinite AI Generator**: Uses an advanced LLM Prompt Builder with "strict 3-5 line descriptions" and "Triple Quote Sanity Checks" to generate unique algorithmic bugs.
-   **History-Aware Deduplication**: The AI Engine maintains a localized memory store for each domain, completely eliminating repeated questions (even when a user "Forced Regens").
-   **Multi-Domain Mastery**: Practice across specialized tracks including `DSA`, `Frontend`, `Backend`, `SQL`, and `CS Fundamentals`.
-   **Sandbox Evaluation Hub**: Pre-flight "Dry Run" test executions inside the Forge Console, or commit "Verified Resolutions" to earn stars, coins, and XP.
-   **Gamified Progression System**: Gain XP and level up dynamically, unlocking higher difficulty tasks as your rank scales.
-   **Guaranteed Safety**: Multi-stage generation retry logic backed by a guaranteed "Sentinel's Sum" standard task mechanism ensuring zero system downtime.

---

## 🛠️ Setup & Installation Instructions

This project requires simultaneous execution of both the Django App and the FastAPI Engine.

### 1. Requirements

- Python 3.10+
- Django 5.x
- FastAPI & Uvicorn
- Requests framework
- A local LLM Engine endpoint (defaults to Llama 3 on port `11434`, configurable via `scillforge/ai_engine/core/config.py`).

### 2. Startup Protocol

First, boot the AI Evaluation Engine:

```bash
cd ai_engine
uvicorn main:app --reload --port 8001
```

In a new terminal window, boot the Django Frontend:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 3. Database Management & Seeding

SkillForge contains an administrative seeder script to securely reset the platform and pre-warm the databases with distinct tasks per domain.

To completely reset the AI Engine memory banks (Caution: this erases all stored tasks):
```bash
python seed.py --reset-only
```

To pre-generate tasks per domain:
```bash
# E.g., Generates 1 task for each domain to prep the caches
python seed.py --count 1
```

---

## 🔌 API Route Overview (FastAPI Engine)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/generate/task` | Generates a strictly unique, history-aware task based on domain and level. |
| `POST` | `/generate/reset` | Clears all persisted task memory and user progress stores. |
| `POST` | `/evaluate/` | Code Evaluation router that runs `evaluator.py`, returning test case results and progression rewards. |

---

> *Built for resilience, engineered for infinity.*  Welcome to the Forge.
