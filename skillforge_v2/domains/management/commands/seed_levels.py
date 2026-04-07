import os
import json
import difflib
from django.core.management.base import BaseCommand
from django.db import transaction
from domains.models import Domain, Level

class Command(BaseCommand):
    help = 'Seeds levels for all domains from JSON files in db/domains/'

    def handle(self, *args, **options):
        base_dir = 'db/domains/'
        if not os.path.exists(base_dir):
            self.stderr.write(self.style.ERROR(f"Directory {base_dir} not found."))
            return

        json_files = [f for f in os.listdir(base_dir) if f.endswith('.json')]
        if not json_files:
            self.stderr.write(self.style.WARNING(f"No JSON files found in {base_dir}."))
            return

        for filename in json_files:
            file_path = os.path.join(base_dir, filename)
            self.stdout.write(self.style.NOTICE(f"\n🚀 Processing Domain: {filename.split('.')[0].upper()}"))
            
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                domain_name = data.get('domain')
                levels_data = data.get('levels', [])
                
                if not domain_name:
                    self.stderr.write(self.style.ERROR(f"❌ Error in {filename}: Missing 'domain' field."))
                    continue
                
                # 1. Strict Validation: Exactly 100 levels
                if len(levels_data) != 100:
                    self.stderr.write(self.style.ERROR(f"❌ Error in {filename}: Found {len(levels_data)} levels. Expected exactly 100."))
                    continue
                
                domain_obj, _ = Domain.objects.get_or_create(name=domain_name)
                
                # Fetch existing levels for this domain
                existing_levels = {l.level_number: l for l in Level.objects.filter(domain=domain_obj)}
                
                levels_to_create = []
                levels_to_update = []
                
                for idx, level_data in enumerate(levels_data, start=1):
                    l_num = level_data.get('level')
                    
                    # 2. Strict Validation: Sequential level numbers
                    if l_num != idx:
                         self.stderr.write(self.style.ERROR(f"❌ Error in {filename}: Level numbers not sequential. Expected {idx}, found {l_num}."))
                         break
                    
                    title = level_data['title']
                    desc = level_data['description']
                    diff = level_data['difficulty']
                    concept = level_data['concept']
                    s_code = level_data['starter_code']
                    sol_code = level_data['solution_code']
                    
                    # 3. Validation: Code blocks distinct and non-empty
                    if not s_code or not sol_code:
                        self.stderr.write(self.style.ERROR(f"❌ Level {l_num}: Code blocks cannot be empty."))
                        continue
                    if s_code == sol_code:
                        self.stderr.write(self.style.ERROR(f"❌ Level {l_num}: starter_code and solution_code must be different."))
                        continue
                    
                    # 4. Validation: Minimal change check (1-3 lines)
                    diff_count = self.get_code_difference(s_code, sol_code)
                    if diff_count > 3:
                        self.stderr.write(self.style.ERROR(f"❌ Level {l_num}: Too many changes ({diff_count} lines). Max allowed is 3."))
                        continue
                    if diff_count == 0:
                        self.stderr.write(self.style.ERROR(f"❌ Level {l_num}: No changes detected between starter and solution."))
                        continue

                    if l_num in existing_levels:
                        obj = existing_levels[l_num]
                        obj.title = title
                        obj.description = desc
                        obj.difficulty = diff
                        obj.concept = concept
                        obj.starter_code = s_code
                        obj.solution_code = sol_code
                        levels_to_update.append(obj)
                    else:
                        levels_to_create.append(Level(
                            domain=domain_obj,
                            level_number=l_num,
                            title=title,
                            description=desc,
                            difficulty=diff,
                            concept=concept,
                            starter_code=s_code,
                            solution_code=sol_code
                        ))

                with transaction.atomic():
                    if levels_to_create:
                        Level.objects.bulk_create(levels_to_create)
                        self.stdout.write(self.style.SUCCESS(f"  ✅ Created {len(levels_to_create)} new levels."))
                    
                    if levels_to_update:
                        Level.objects.bulk_update(levels_to_update, [
                            'title', 'description', 'difficulty', 'concept', 'starter_code', 'solution_code'
                        ])
                        self.stdout.write(self.style.SUCCESS(f"  🔄 Updated {len(levels_to_update)} existing levels."))

                self.stdout.write(self.style.SUCCESS(f"🏁 Finished processing {domain_name}."))
                    
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"💥 Unexpected error processing {filename}: {str(e)}"))

    def get_code_difference(self, s1, s2):
        """Returns the number of lines added or removed between two strings."""
        lines1 = [l.strip() for l in s1.splitlines() if l.strip()]
        lines2 = [l.strip() for l in s2.splitlines() if l.strip()]
        diff = difflib.ndiff(lines1, lines2)
        
        changes = 0
        for line in diff:
            if line.startswith('+ ') or line.startswith('- '):
                changes += 1
        return changes
