import json
import requests
import time
import random

# ⚙️ OLLAMA CONFIGURATION
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "llama3"

def generate_task_from_ollama(domain_name, level_num, difficulty, concept, scenario_salt=None):
    """
    Calls the local Ollama instance to generate task fields as JSON.
    Ensures starter_code and solution_code are logically consistent and of the same type.
    """
    if scenario_salt is None:
        scenario_salt = random.choice([
            "e-commerce", "finance", "gaming", "social media", "healthcare", 
            "education", "travel", "productivity", "security", "data-analytics"
        ])

    prompt = f"""
    You are an expert game designer creating coding tasks for SkillForge.
    Domain: {domain_name}.
    Level Number: {level_num} (out of 100).
    Difficulty: {difficulty}.
    Core Concept: {concept}.
    Scenario Context: {scenario_salt}.

    CRITICAL RULES:
    1. The 'starter_code' and 'solution_code' MUST be of the same programming language and style.
    2. The 'starter_code' should be a functional but incomplete snippet (boilerplate/scaffold).
    3. The 'solution_code' should be the full, working implementation of the 'starter_code'.
    4. Provide unique, creative titles and descriptions that are DIFFERENT from common coding tutorials.
    5. No markdown code blocks, just raw JSON.

    Return ONLY a highly structured JSON object:
    {{
        "title": "Creative Title",
        "description": "Engaging description of the challenge.",
        "starter_code": "The incomplete code snippet.",
        "solution_code": "The complete, working solution."
    }}
    """
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.8
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        
        raw_text = response.json().get("response", "{}")
        clean_text = raw_text.strip().strip("```json").strip("```").strip()
        data = json.loads(clean_text)
        
        return {
            "title": data.get("title", f"{domain_name} Task {level_num}"),
            "description": data.get("description", f"Solve this {difficulty} challenge regarding {concept}."),
            "starter_code": data.get("starter_code", f"// Starter code for {domain_name} level {level_num}\n"),
            "solution_code": data.get("solution_code", f"// Solution code for {domain_name} level {level_num}\n")
        }
    except Exception as e:
        print(f"  [!] Ollama generation failed for Lvl {level_num}: {e}")
        return None
