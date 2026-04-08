from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from domains.models import Domain

class LearnerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='learner_profile')
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    preferred_domain = models.ForeignKey(Domain, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"Profile: {self.user.username}"

class LearnerGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_goals')
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    target_level = models.IntegerField(default=10)
    deadline = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s goal: Level {self.target_level} in {self.domain.name}"

# Signals to automatically create LearnerProfile
@receiver(post_save, sender=User)
def create_learner_profile(sender, instance, created, **kwargs):
    if created:
        LearnerProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_learner_profile(sender, instance, **kwargs):
    if not hasattr(instance, 'learner_profile'):
        LearnerProfile.objects.create(user=instance)
    instance.learner_profile.save()
