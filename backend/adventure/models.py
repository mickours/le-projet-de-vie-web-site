from django.contrib.auth.models import AbstractUser
from django.db import models


class Level(models.Model):
    label = models.CharField(max_length=50, unique=True)

    def __str__(self) -> str:
        return self.label


class Role(models.Model):
    label = models.CharField(max_length=50, unique=True)

    def __str__(self) -> str:
        return self.label


class Theme(models.Model):
    label = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return self.label


class Type(models.Model):
    label = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return self.label


class User(AbstractUser):
    avatar = models.CharField(max_length=50, default="👤")
    age = models.IntegerField(null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    level = models.ForeignKey(Level, on_delete=models.SET_NULL, null=True, blank=True)
    children = models.ManyToManyField(
        "self", symmetrical=False, related_name="parents", blank=True
    )


class Activity(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    video_url = models.URLField(max_length=500, blank=True, null=True)
    video_file = models.FileField(upload_to="videos/", blank=True, null=True)
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    logo = models.ImageField(upload_to="logos/", blank=True, null=True)
    type = models.ForeignKey(Type, on_delete=models.SET_NULL, null=True, blank=True)
    theme = models.ForeignKey(Theme, on_delete=models.SET_NULL, null=True, blank=True)
    level = models.ForeignKey(Level, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self) -> str:
        return self.title


class Document(models.Model):
    DOC_TYPES = [
        ("pdf", "PDF"),
        ("video_file", "Video File"),
        ("video_link", "Video Link"),
    ]
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to="documents/", blank=True, null=True)
    url = models.URLField(max_length=500, blank=True, null=True)
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES, default="pdf")
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="documents"
    )

    def __str__(self) -> str:
        return self.filename


class UserActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activities")
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("user", "activity")


class Comment(models.Model):
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="comments"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_moderated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Comment by {self.user.username} on {self.activity.title}"
