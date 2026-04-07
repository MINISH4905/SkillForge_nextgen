import os
import django
import json
import requests
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillforge.settings')
django.setup()

from domains.models import Domain, Level

# ⚙️ OLLAMA CONFIGURATION
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "llama3" # Ensure you have this model pulled: `ollama run llama3`

def generate_task_from_ollama(domain_name, level_num, difficulty, concept):
    """
    Calls the local Ollama instance to generate task fields as JSON.
    """
    prompt = f"""
    You are an expert game designer creating coding tasks for a platform called SkillForge.
    Generate a task for the domain: {domain_name}.
    Level Number: {level_num} (out of 100).
    Difficulty: {difficulty}.
    Core Concept to teach: {concept}.

    Return ONLY a highly structured JSON object with the exact keys below. Do not include markdown blocks, just the raw JSON.
    {{
        "title": "A creative, short name for the task",
        "description": "2-3 short sentences describing the programming challenge without giving away the exact solution.",
        "starter_code": "The initial code snippet or boilerplate required to start the task."
    }}
    """
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.7
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=45)
        response.raise_for_status()
        
        raw_text = response.json().get("response", "{}")
        # Ensure clean json extraction
        clean_text = raw_text.strip().strip("```json").strip("```").strip()
        data = json.loads(clean_text)
        
        return {
            "title": data.get("title", f"{domain_name} Task {level_num}"),
            "description": data.get("description", f"Solve this {difficulty} challenge regarding {concept}."),
            "starter_code": data.get("starter_code", f"// Starter code for {domain_name} level {level_num}\n")
        }
    except Exception as e:
        print(f"  [!] Ollama generation failed for Lvl {level_num}: {e}")
        return None

def run():
    print("🔥 Forging Database with Ollama... (This will take time)")
    
    frontend, _ = Domain.objects.get_or_create(name='Frontend')
    backend, _ = Domain.objects.get_or_create(name='Backend')
    dsa, _ = Domain.objects.get_or_create(name='DSA')
    sql, _ = Domain.objects.get_or_create(name='SQL')
    
    domains = [
        (frontend, "HTML/CSS/JS"),
        (backend, "Frameworks & Logic"),
        (dsa, "Algorithms & Structures"),
        (sql, "Databases")
    ]
    
    # We will just do the first 5 levels per domain for demonstration purposes,
    # as 400 levels via local LLM will take hours.
    GENERATION_CAP = 5 
    
    for dom_obj, concept_base in domains:
        print(f"\n⚡ Generating tasks for {dom_obj.name}...")
        
        levels_to_create = []
        for i in range(1, GENERATION_CAP + 1):
            diff = 'easy'
            if i > 25: diff = 'medium'
            if i > 60: diff = 'hard'
            if i > 85: diff = 'expert'
            
            concept = concept_base if i < 50 else f"Advanced {concept_base}"
            
            print(f"  -> Consulting {MODEL_NAME} for Level {i} ({diff})... ", end="", flush=True)
            
            start_time = time.time()
            llm_data = generate_task_from_ollama(dom_obj.name, i, diff, concept)
            
            if llm_data:
                print(f"Success! ({round(time.time() - start_time, 2)}s)")
                title = llm_data["title"]
                desc = llm_data["description"]
                starter = llm_data["starter_code"]
            else:
                print("Failed. Using Fallback.")
                title = f"{dom_obj.name} Fallback {i}"
                desc = f"Solve this {diff} algorithm."
                starter = "// Fallback code"

            levels_to_create.append(Level(
                domain=dom_obj,
                level_number=i,
                title=title,
                description=desc[:900], # safety cutoff
                difficulty=diff,
                concept=concept,
                starter_code=starter
            ))
            
        print(f"Saving {len(levels_to_create)} levels to DB...")
        # Clear existing to prevent duplicate constraint errors if rerunning
        Level.objects.filter(domain=dom_obj, level_number__lte=GENERATION_CAP).delete()
        Level.objects.bulk_create(levels_to_create)
        
    print(f"\n✅ All set. Seeded {GENERATION_CAP} levels per domain using local Ollama processing!")

if __name__ == '__main__':
    run()
