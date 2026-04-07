import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillforge.settings')
django.setup()

from domains.models import Domain, Level

print("-" * 30)
print(f"{'Domain':<20} | {'Level Count':<10}")
print("-" * 30)

for domain in Domain.objects.all():
    count = Level.objects.filter(domain=domain).count()
    print(f"{domain.name:<20} | {count:<10}")

print("-" * 30)
