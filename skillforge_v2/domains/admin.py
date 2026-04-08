from django.contrib import admin
from .models import Domain, Level, Hint

class HintInline(admin.TabularInline):
    model = Hint
    extra = 1

@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('domain', 'level_number', 'title', 'difficulty', 'concept')
    list_filter = ('domain', 'difficulty')
    search_fields = ('title', 'concept')
    ordering = ('domain', 'level_number')
    inlines = [HintInline]

@admin.register(Hint)
class HintAdmin(admin.ModelAdmin):
    list_display = ('level', 'order', 'content')
    list_filter = ('level__domain',)
