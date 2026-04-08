from django.db import models
from django.contrib.auth.models import User


class LearnerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='learner_profile')
    level = models.IntegerField(default=1)
    xp_total = models.IntegerField(default=0)
    lives = models.IntegerField(default=3)
    coins = models.IntegerField(default=100)
    streak_days = models.IntegerField(default=0)
    last_submission_date = models.DateField(null=True, blank=True)
    badges_earned = models.JSONField(default=list)

    def __str__(self):
        return f"{self.user.username} (Lvl {self.level})"


class DomainCompetency(models.Model):
    DOMAIN_CHOICES = [
        ('web', 'Web Development'),
        ('dsa', 'DSA'),
        ('database', 'Database'),
        ('aiml', 'AI/ML'),
        ('sysdesign', 'System Design'),
    ]
    learner = models.ForeignKey(LearnerProfile, on_delete=models.CASCADE, related_name='competencies')
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    tier = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    competency_score = models.IntegerField(default=0)  # 0–100

    class Meta:
        unique_together = ('learner', 'domain')

    def __str__(self):
        return f"{self.learner.user.username} - {self.domain} (Tier {self.tier})"


class Task(models.Model):
    DOMAIN_CHOICES = DomainCompetency.DOMAIN_CHOICES

    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    tier = models.IntegerField(default=1)
    title = models.CharField(max_length=255)
    instructions = models.TextField()
    given_code = models.TextField()
    expected_output = models.TextField()
    model_solution = models.TextField()
    constraints = models.JSONField(default=list)
    # Which section this task maps to (for weak-area detection)
    section_id = models.CharField(max_length=20, blank=True, default='')

    def __str__(self):
        return f"[{self.domain}] {self.title} (Tier {self.tier})"


class TaskBug(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='bugs')
    text = models.CharField(max_length=255)

    def __str__(self):
        return self.text


class TaskHint(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='mentor_questions')
    text = models.TextField()

    def __str__(self):
        return f"Hint for {self.task.title}"


class GameSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned')
    ]
    learner = models.ForeignKey(LearnerProfile, on_delete=models.CASCADE, related_name='sessions')
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)


class CodeSubmission(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='submissions')
    code = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    score_total = models.IntegerField(default=0)
    score_breakdown = models.JSONField(default=dict)
    bugs_fixed = models.IntegerField(default=0)
    xp_earned = models.IntegerField(default=0)
    is_first_attempt = models.BooleanField(default=False)


# ─── Remediation ──────────────────────────────────────────────────────────────

class RemediationPlan(models.Model):
    """
    One active 30-day plan per learner, targeting their weakest domain.
    Weak areas are determined at creation time from DomainCompetency scores
    and recent CodeSubmission results.
    """
    learner = models.ForeignKey(LearnerProfile, on_delete=models.CASCADE, related_name='remediation_plans')
    domain = models.CharField(max_length=20, choices=DomainCompetency.DOMAIN_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    current_day = models.IntegerField(default=1)
    current_phase = models.IntegerField(default=1)          # 1–4
    phase_unlocked = models.JSONField(default=list)         # e.g. [1, 2]
    weak_areas = models.JSONField(default=list)             # section names
    baseline_competency = models.IntegerField(default=0)    # score at plan start
    overall_competency = models.IntegerField(default=0)     # rolling average
    skill_snapshots = models.JSONField(default=list)        # [{day, score, topic, xp}]
    mastered = models.BooleanField(default=False)

    def __str__(self):
        return f"Plan for {self.learner.user.username} — {self.domain} (Day {self.current_day}/30)"


class RemediationDay(models.Model):
    """
    One day in a 30-day plan. Contains:
    - The topic / section it covers
    - Phase (1=Foundation, 2=Application, 3=Stress Test, 4=Mastery)
    - Curated exercises (stored as JSON so they don't need a separate model)
    - Curated resources (links, stored as JSON)
    - Completion tracking + score
    """
    PHASE_CHOICES = [
        (1, 'Foundation'),
        (2, 'Application'),
        (3, 'Stress Test'),
        (4, 'Mastery'),
    ]

    plan = models.ForeignKey(RemediationPlan, on_delete=models.CASCADE, related_name='days')
    day_number = models.IntegerField()
    phase = models.IntegerField(choices=PHASE_CHOICES, default=1)
    phase_name = models.CharField(max_length=20, default='Foundation')
    is_checkpoint = models.BooleanField(default=False)

    # Topic metadata
    label = models.CharField(max_length=255, default='')       # e.g. "Day 3 — Flexbox flow"
    topic = models.CharField(max_length=100, default='')
    section_id = models.CharField(max_length=20, blank=True, default='')
    objective = models.TextField(default='')
    concept_card = models.JSONField(null=True, blank=True)     # {title, bullets, example_code}

    # Content (JSON arrays)
    exercises = models.JSONField(default=list)     # [{type, question/snippet/...}]
    resources = models.JSONField(default=list)     # [{title, url, type}]

    # Progress
    is_completed = models.BooleanField(default=False)
    score = models.IntegerField(null=True, blank=True)         # 0–100
    exercises_done = models.IntegerField(default=0)
    xp_base = models.IntegerField(default=100)
    xp_earned = models.IntegerField(default=0)
    time_estimate_min = models.IntegerField(default=16)

    class Meta:
        unique_together = ('plan', 'day_number')
        ordering = ['day_number']

    def __str__(self):
        return f"{self.plan} — Day {self.day_number}: {self.topic}"
