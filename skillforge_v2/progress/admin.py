from django.contrib import admin
from .models import UserProgress

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'domain', 'current_level')
    list_filter = ('domain',)
    search_fields = ('user__username', 'domain__name')
