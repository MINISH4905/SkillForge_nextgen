from django.contrib import admin
from .models import Domain, Level

@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('domain', 'level_number', 'title', 'difficulty', 'concept', 'solution_code')
    list_filter = ('domain', 'difficulty')
    search_fields = ('title', 'concept', 'solution_code')
    ordering = ('domain', 'level_number')
