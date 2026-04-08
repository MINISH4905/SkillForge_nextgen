from rest_framework import serializers
from .models import (
    LearnerProfile, DomainCompetency,
    Task, TaskBug, TaskHint,
    GameSession, CodeSubmission,
    RemediationPlan, RemediationDay,
)


class LearnerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearnerProfile
        fields = ['level', 'xp_total', 'lives', 'coins', 'streak_days', 'badges_earned']


class DomainCompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = DomainCompetency
        fields = ['domain', 'tier', 'xp', 'competency_score']


class TaskSerializer(serializers.ModelSerializer):
    bugs = serializers.StringRelatedField(many=True, read_only=True)
    mentor_questions = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'domain', 'tier', 'title', 'instructions',
            'given_code', 'expected_output', 'constraints',
            'bugs', 'mentor_questions', 'section_id',
        ]


class GameSessionSerializer(serializers.ModelSerializer):
    task = TaskSerializer(read_only=True)

    class Meta:
        model = GameSession
        fields = ['id', 'task', 'status', 'started_at']


# ── Remediation ───────────────────────────────────────────────────────────────

class RemediationDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = RemediationDay
        fields = [
            'id', 'day_number', 'phase', 'phase_name', 'is_checkpoint',
            'label', 'topic', 'section_id', 'objective', 'concept_card',
            'exercises', 'resources',
            'is_completed', 'score', 'exercises_done',
            'xp_base', 'xp_earned', 'time_estimate_min',
        ]


class RemediationDayBriefSerializer(serializers.ModelSerializer):
    """Lightweight version for the overview list — no exercises/resources payload."""
    class Meta:
        model = RemediationDay
        fields = [
            'id', 'day_number', 'phase', 'phase_name', 'is_checkpoint',
            'label', 'topic', 'is_completed', 'score', 'xp_earned',
        ]


class RemediationPlanSerializer(serializers.ModelSerializer):
    days = RemediationDayBriefSerializer(many=True, read_only=True)

    class Meta:
        model = RemediationPlan
        fields = [
            'id', 'domain', 'current_day', 'current_phase',
            'phase_unlocked', 'weak_areas', 'baseline_competency',
            'overall_competency', 'skill_snapshots', 'mastered',
            'created_at', 'days',
        ]


class RemediationPlanFullSerializer(serializers.ModelSerializer):
    """Full serializer including exercise + resource payloads for each day."""
    days = RemediationDaySerializer(many=True, read_only=True)

    class Meta:
        model = RemediationPlan
        fields = [
            'id', 'domain', 'current_day', 'current_phase',
            'phase_unlocked', 'weak_areas', 'baseline_competency',
            'overall_competency', 'skill_snapshots', 'mastered',
            'created_at', 'days',
        ]
