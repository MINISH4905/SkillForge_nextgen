from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Domain(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Level(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('expert', 'Expert'),
    ]

    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name='levels')
    level_number = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(100)])
    title = models.CharField(max_length=200)
    description = models.TextField(help_text="2-5 lines describing the task")
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    concept = models.CharField(max_length=100, help_text="Core concept taught or tested")
    starter_code = models.TextField(blank=True)
    solution_code = models.TextField(blank=True)

    class Meta:
        unique_together = ('domain', 'level_number')
        ordering = ['level_number']

    def __str__(self):
        return f"{self.domain.name} - Level {self.level_number}: {self.title}"

class Hint(models.Model):
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='hints')
    order = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(3)])
    content = models.TextField()

    class Meta:
        unique_together = ('level', 'order')
        ordering = ['order']

    def __str__(self):
        return f"Hint {self.order} for Level {self.level.level_number}"

