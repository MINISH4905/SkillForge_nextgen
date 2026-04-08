from django.contrib import admin
from .models import UserXP, Badge, UserBadge, Power, UserPower, UserHintUsage

@admin.register(UserXP)
class UserXPAdmin(admin.ModelAdmin):
    list_display = ('user', 'xp')
    search_fields = ('user__username',)

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'required_level')

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'awarded_at')
    list_filter = ('badge',)

@admin.register(Power)
class PowerAdmin(admin.ModelAdmin):
    list_display = ('name', 'cost')

@admin.register(UserPower)
class UserPowerAdmin(admin.ModelAdmin):
    list_display = ('user', 'power', 'quantity')
    list_filter = ('power',)

@admin.register(UserHintUsage)
class UserHintUsageAdmin(admin.ModelAdmin):
    list_display = ('user', 'level', 'hints_used')
    list_filter = ('level__domain',)
