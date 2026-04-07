from django.db import models
from django.contrib.auth.models import User

class UserXP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='xp_profile')
    xp = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.xp} XP"

class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    required_level = models.IntegerField(help_text="Level milestone required (e.g. 10, 20)")
    
    def __str__(self):
        return self.name

class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')

    def __str__(self):
        return f"{self.user.username} unlocked {self.badge.name}"

class Power(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    cost = models.IntegerField(help_text="XP cost to purchase")

    def __str__(self):
        return self.name

class UserPower(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='powers')
    power = models.ForeignKey(Power, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'power')

    def __str__(self):
        return f"{self.user.username} has {self.quantity} x {self.power.name}"

class UserHintUsage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hint_usages')
    level = models.ForeignKey('domains.Level', on_delete=models.CASCADE)
    hints_used = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'level')

    def __str__(self):
        return f"{self.user.username} used {self.hints_used} hints on {self.level}"

