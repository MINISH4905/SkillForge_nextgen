import os
import django
import random
import time

# Setup Django before using models
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillforge.settings')
django.setup()

from domains.models import Domain, Level
from seeding_utils import generate_task_from_ollama

def run_seeding(num_levels=100):
    domain_name = 'Frontend'
    print(f"🔥 Seeding {domain_name} Tasks...")
    
    dom_obj, _ = Domain.objects.get_or_create(name=domain_name)
    
    concepts = [
        "Centering a Div", "CSS Flexbox", "CSS Grid", "Responsive Design", 
        "Form Validation", "Dark Mode Implementation", "DOM Manipulation", 
        "Event Listeners", "Fetch API", "Local Storage", "Canvas API", 
        "CSS Animations", "Z-index Mastery", "Accessibility (ARIA)", 
        "Semantic HTML", "Web Components", "Lazy Loading Images"
    ]
    
    levels_to_create = []
    for i in range(1, num_levels + 1):
        diff = 'easy'
        if i > 25: diff = 'medium'
        if i > 60: diff = 'hard'
        if i > 85: diff = 'expert'
        
        concept = random.choice(concepts)
        if i > 50:
            concept = f"Advanced {concept}"
            
        print(f"  -> Generating {domain_name} Level {i} ({diff})... ", end="", flush=True)
        start_time = time.time()
        
        # Use random salts to ensure diversity
        salt = random.choice(["E-commerce Shop", "Personal Portfolio", "Dashboard UI", "Gaming HUD", "Social Media Feed"])
        llm_data = generate_task_from_ollama(domain_name, i, diff, concept, scenario_salt=salt)
        
        if llm_data:
            print(f"Success! ({round(time.time() - start_time, 2)}s)")
            levels_to_create.append(Level(
                domain=dom_obj,
                level_number=i,
                title=llm_data["title"],
                description=llm_data["description"][:900],
                difficulty=diff,
                concept=concept,
                starter_code=llm_data["starter_code"],
                solution_code=llm_data["solution_code"]
            ))
        else:
            print("Failed. Skipping.")

    if levels_to_create:
        print(f"Saving {len(levels_to_create)} levels for {domain_name} to DB...")
        Level.objects.filter(domain=dom_obj).delete()
        Level.objects.bulk_create(levels_to_create)
        print(f"✅ {domain_name} Seeded.")

if __name__ == "__main__":
    # For testing, we'll just do 2 levels. 
    # The batch file can be modified later for 100.
    run_seeding(num_levels=2)
