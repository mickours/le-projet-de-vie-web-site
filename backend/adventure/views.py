from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from .models import Activity, Level, Role, UserActivity, Comment, User
from django.contrib.auth.forms import UserCreationForm
from django import forms


class AdventureUserCreationForm(UserCreationForm):
    role = forms.ModelChoiceField(queryset=Role.objects.exclude(label="admin"))
    level = forms.ModelChoiceField(queryset=Level.objects.all(), required=False)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ("role", "level")


def home(request):
    return render(request, "adventure/home.html")


def dashboard(request):
    levels = Level.objects.all()
    roles = Role.objects.exclude(label="admin")

    level_icons = {
        "6ème": "🌱",
        "5ème": "🌿",
        "4ème": "🌳",
        "3ème": "⚔️",
        "2nde": "🛡️",
        "1ère": "🏹",
        "Terminale": "👑",
        "Apprenti": "🛠️",
        "Autre": "❓",
    }
    role_icons = {
        "élève": "🎒",
        "parent": "👨‍👩‍👧",
        "enseignant": "👨‍🏫",
        "professionnel de l'orientation": "🧭",
    }

    for lvl in levels:
        lvl.icon = level_icons.get(lvl.label, "📚")
    for rl in roles:
        rl.icon = role_icons.get(rl.label, "👤")

    return render(
        request, "adventure/dashboard.html", {"levels": levels, "roles": roles}
    )


def register(request):
    if request.method == "POST":
        form = AdventureUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("adventure:dashboard")
    else:
        form = AdventureUserCreationForm()

    # Pre-populate Role and Level for the form rendering
    roles = Role.objects.exclude(label="admin")
    levels = Level.objects.all()
    return render(
        request,
        "adventure/register.html",
        {"form": form, "roles": roles, "levels": levels},
    )


def activity_list(request):
    level_id = request.GET.get("level_id")
    role_id = request.GET.get("role_id")

    activities = (
        Activity.objects.all()
        .select_related("theme", "type", "level", "role")
        .prefetch_related("documents")
    )

    if level_id:
        activities = activities.filter(level_id=level_id)
    if role_id:
        activities = activities.filter(role_id=role_id)

    levels = Level.objects.all()
    return render(
        request,
        "adventure/activity_list.html",
        {"activities": activities, "levels": levels},
    )


def activity_detail(request, activity_id):
    activity = get_object_or_404(Activity, id=activity_id)
    comments = activity.comments.filter(is_moderated=True).order_by("-created_at")

    user_activity = None
    if request.user.is_authenticated:
        user_activity, _ = UserActivity.objects.get_or_create(
            user=request.user, activity=activity
        )

    return render(
        request,
        "adventure/activity_detail.html",
        {"activity": activity, "comments": comments, "user_activity": user_activity},
    )


@login_required
def save_progress(request, activity_id):
    if request.method == "POST":
        activity = get_object_or_404(Activity, id=activity_id)
        ua, _ = UserActivity.objects.get_or_create(user=request.user, activity=activity)
        ua.is_completed = "is_completed" in request.POST
        ua.notes = request.POST.get("notes", "")
        ua.save()
    return redirect("adventure:activity_detail", activity_id=activity_id)


@login_required
def add_comment(request, activity_id):
    if request.method == "POST":
        activity = get_object_or_404(Activity, id=activity_id)
        Comment.objects.create(
            user=request.user,
            activity=activity,
            content=request.POST.get("content", ""),
            is_moderated=False,
        )
    return redirect("adventure:activity_detail", activity_id=activity_id)


@login_required
def dossier(request):
    user_activities = UserActivity.objects.filter(
        user=request.user, is_completed=True
    ).select_related("activity", "activity__theme")
    return render(
        request, "adventure/dossier.html", {"user_activities": user_activities}
    )


@login_required
def profile(request):
    if request.method == "POST":
        user = request.user
        user.age = request.POST.get("age")
        user.avatar = request.POST.get("avatar", "👤")
        user.role_id = request.POST.get("role_id")
        user.level_id = request.POST.get("level_id")
        user.save()
        return redirect("adventure:profile")

    roles = Role.objects.exclude(label="admin")
    levels = Level.objects.all()
    return render(request, "adventure/profile.html", {"roles": roles, "levels": levels})
