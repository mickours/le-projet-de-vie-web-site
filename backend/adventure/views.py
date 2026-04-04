from django.shortcuts import render, get_object_or_404, redirect
from .models import Activity, Level, Role, UserActivity, Comment


def home(request):
    return render(request, "adventure/home.html")


def dashboard(request):
    levels = Level.objects.all()
    roles = Role.objects.exclude(label="admin")

    # Adding icons manually for now to match the frontend JS logic
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


def save_progress(request, activity_id):
    if not request.user.is_authenticated:
        return redirect("login")
    if request.method == "POST":
        activity = get_object_or_404(Activity, id=activity_id)
        ua, _ = UserActivity.objects.get_or_create(user=request.user, activity=activity)
        ua.is_completed = "is_completed" in request.POST
        ua.notes = request.POST.get("notes", "")
        ua.save()
    return redirect("adventure:activity_detail", activity_id=activity_id)


def add_comment(request, activity_id):
    if not request.user.is_authenticated:
        return redirect("login")
    if request.method == "POST":
        activity = get_object_or_404(Activity, id=activity_id)
        Comment.objects.create(
            user=request.user,
            activity=activity,
            content=request.POST.get("content", ""),
            is_moderated=False,  # Requires moderation
        )
    return redirect("adventure:activity_detail", activity_id=activity_id)


def dossier(request):
    if not request.user.is_authenticated:
        return redirect("login")
    # Logic for dossier
    return render(request, "adventure/dossier.html")


def profile(request):
    if not request.user.is_authenticated:
        return redirect("login")
    # Logic for profile
    return render(request, "adventure/profile.html")
