import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillforge.settings')
django.setup()

from domains.models import Domain, Level

def run():
    print("Seeding dummy data for SkillForge V2...")
    
    Domain.objects.all().delete()
    
    frontend, _ = Domain.objects.get_or_create(name='Frontend')
    backend, _ = Domain.objects.get_or_create(name='Backend')
    dsa, _ = Domain.objects.get_or_create(name='DSA')
    sql, _ = Domain.objects.get_or_create(name='SQL')
    
    print("Created domains. Generating 100 levels per domain...")
    
    levels_to_create = []
    
    domains = [
        (frontend, "Frontend Task", "Build a component", "HTML/CSS/JS"),
        (backend, "Backend Task", "Build an API endpoint", "Frameworks & Logic"),
        (dsa, "DSA Problem", "Solve the algorithm", "Algorithms & Structures"),
        (sql, "SQL Query", "Write a standard SQL query", "Databases")
    ]
    
    for dom_obj, title_prefix, desc_prefix, concept_base in domains:
        for i in range(1, 101):
            diff = 'easy'
            if i > 25: diff = 'medium'
            if i > 60: diff = 'hard'
            if i > 85: diff = 'expert'
            
            concept = concept_base if i < 50 else f"Advanced {concept_base}"
            
            levels_to_create.append(Level(
                domain=dom_obj,
                level_number=i,
                title=f"{title_prefix} {i}",
                description=f"{desc_prefix} for challenge #{i}.",
                difficulty=diff,
                concept=concept,
                starter_code=f"// Starter code for {dom_obj.name} level {i}\n"
            ))
            
    Level.objects.bulk_create(levels_to_create)
    print("Successfully seeded 400 static levels!")

if __name__ == '__main__':
    run()
