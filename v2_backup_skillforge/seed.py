import argparse
import requests
import time
import sys

AI_ENGINE_URL = "http://127.0.0.1:8001"
DOMAINS = ["dsa", "frontend", "backend", "sql", "cs_fundamentals"]
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

def ping_server():
    print(f"Checking AI Engine status at {AI_ENGINE_URL}...")
    try:
        response = requests.get(f"{AI_ENGINE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ AI Engine is ONLINE.\n")
            return True
    except requests.exceptions.RequestException:
        pass
    
    print("❌ AI Engine is OFFLINE. Please start it with: 'cd ai_engine && uvicorn main:app --reload --port 8001'")
    return False

def reset_database():
    print("🧹 Resetting AI Engine Database...")
    try:
        res = requests.post(f"{AI_ENGINE_URL}/generate/reset", json={}, timeout=10)
        res.raise_for_status()
        print("✅ Database reset successful.\n")
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to reset database: {e}")
        sys.exit(1)

def seed_tasks(count_per_domain=1):
    print(f"🌱 Seeding {count_per_domain} task(s) for each domain...")
    
    for domain in DOMAINS:
        print(f"\nGenerators spooling for domain: [{domain.upper()}]...")
        for i in range(1, count_per_domain + 1):
            difficulty = "easy"
            level = i
            
            payload = {
                "domain": domain,
                "difficulty": difficulty,
                "level": level
            }
            
            print(f"  -> Forging task {i}/{count_per_domain} (Level {level})...")
            try:
                # Set a high timeout because LLM generation can take time
                res = requests.post(f"{AI_ENGINE_URL}/generate/task", json=payload, timeout=180)
                res.raise_for_status()
                data = res.json().get('data', {})
                print(f"     ✅ Success! Task created: '{data.get('title')}'")
            except requests.exceptions.HTTPError as errStatus:
                 print(f"     ❌ Generation failed for {domain}: {errStatus.response.text}")
            except requests.exceptions.RequestException as e:
                print(f"     ❌ Engine Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SkillForge Production Seeder")
    parser.add_argument("--count", type=int, default=1, help="Number of initial tasks to generate per domain")
    parser.add_argument("--reset-only", action="store_true", help="Only clear the database, do not generate tasks")
    args = parser.parse_args()

    if not ping_server():
        sys.exit(1)

    reset_database()
    
    if not args.reset_only:
        seed_tasks(count_per_domain=args.count)
        
    print("\n🎉 Seeding complete. SkillForge is production-ready!")
