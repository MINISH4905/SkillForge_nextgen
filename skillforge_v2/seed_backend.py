import os
import django
import random
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillforge.settings')
django.setup()

from domains.models import Domain, Level
from seeding_utils import generate_task_from_ollama

def run_seeding(num_levels=100):
    domain_name = 'Backend'
    print(f"🔥 Seeding {domain_name} Tasks...")
    dom_obj, _ = Domain.objects.get_or_create(name=domain_name)
    
    concepts = [
        "REST API Design", "Authentication (JWT)", "Middleware", "Database Migrations",
        "Caching (Redis)", "Message Queues (RabbitMQ)", "WebSockets", "Dockerization",
        "Unit Testing", "Logging & Monitoring", "Server-Side Rendering", 
        "Load Balancing", "Microservices Architecture", "API Documentation (Swagger)"
    ]
    
    levels_to_create = []
    for i in range(1, num_levels + 1):
        diff = 'easy'
        if i > 25: diff = 'medium'
        if i > 60: diff = 'hard'
        if i > 85: diff = 'expert'
        
        concept = random.choice(concepts)
        print(f"  -> Generating {domain_name} Level {i} ({diff})... ", end="", flush=True)
        llm_data = generate_task_from_ollama(domain_name, i, diff, concept)
        if llm_data:
            print(f"Success!")
            levels_to_create.append(Level(
                domain=dom_obj, level_number=i, title=llm_data["title"],
                description=llm_data["description"][:900], difficulty=diff,
                concept=concept, starter_code=llm_data["starter_code"],
                solution_code=llm_data["solution_code"]
            ))
        else:
            print("Failed.")

    if levels_to_create:
        Level.objects.filter(domain=dom_obj).delete()
        Level.objects.bulk_create(levels_to_create)
        print(f"✅ {domain_name} Seeded.")

if __name__ == "__main__":
    run_seeding(num_levels=2)
