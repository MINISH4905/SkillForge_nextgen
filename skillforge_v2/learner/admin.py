from django.contrib import admin
from .models import (
    LearnerProfile, DomainCompetency,
    Task, TaskBug, TaskHint,
    GameSession, CodeSubmission,
    RemediationPlan, RemediationDay,
)


@admin.register(LearnerProfile)
class LearnerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'level', 'xp_total', 'lives', 'streak_days']
    search_fields = ['user__username']


@admin.register(DomainCompetency)
class DomainCompetencyAdmin(admin.ModelAdmin):
    list_display = ['learner', 'domain', 'tier', 'competency_score', 'xp']
    list_filter = ['domain', 'tier']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'domain', 'tier', 'section_id']
    list_filter = ['domain', 'tier']
    search_fields = ['title']


class TaskBugInline(admin.TabularInline):
    model = TaskBug
    extra = 1


class TaskHintInline(admin.TabularInline):
    model = TaskHint
    extra = 1


@admin.register(TaskBug)
class TaskBugAdmin(admin.ModelAdmin):
    list_display = ['task', 'text']


@admin.register(TaskHint)
class TaskHintAdmin(admin.ModelAdmin):
    list_display = ['task']


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['learner', 'task', 'status', 'score', 'started_at']
    list_filter = ['status']


@admin.register(CodeSubmission)
class CodeSubmissionAdmin(admin.ModelAdmin):
    list_display = ['session', 'score_total', 'bugs_fixed', 'xp_earned', 'submitted_at']


@admin.register(RemediationPlan)
class RemediationPlanAdmin(admin.ModelAdmin):
    list_display = ['learner', 'domain', 'current_day', 'current_phase',
                    'overall_competency', 'is_active', 'mastered']
    list_filter = ['domain', 'is_active', 'mastered']


@admin.register(RemediationDay)
class RemediationDayAdmin(admin.ModelAdmin):
    list_display = ['plan', 'day_number', 'phase', 'topic', 'is_checkpoint',
                    'is_completed', 'score', 'xp_earned']
    list_filter = ['phase', 'is_checkpoint', 'is_completed']
    ordering = ['plan', 'day_number']
