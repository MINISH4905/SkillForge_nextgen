from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    coins = models.IntegerField(default=0)
    domain = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True) 

    def __str__(self):
        return self.user.username