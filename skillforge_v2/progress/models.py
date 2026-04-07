from django.db import models
from django.contrib.auth.models import User
from domains.models import Domain

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    current_level = models.IntegerField(default=1)

    class Meta:
        unique_together = ('user', 'domain')
    
    def __str__(self):
        return f"{self.user.username} - {self.domain.name} (Level {self.current_level})"
