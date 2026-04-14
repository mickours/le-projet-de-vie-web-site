from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_POST
from .models import (
    Activity,
    Level,
    Role,
    Theme,
    Type,
    UserActivity,
    Comment,
    User,
    Document,
)


class AdventureUserCreationForm(UserCreationForm):
    role = forms.ModelChoiceField(queryset=Role.objects.exclude(label="admin"))
    level = forms.ModelChoiceField(queryset=Level.objects.all(), required=False)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ("role", "level")


def home(request):
    return render(request, "adventure/index.html")


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


@staff_member_required
def admin_dashboard(request):
    if request.method == "POST":
        activity = Activity.objects.create(
            title=request.POST.get("title"),
            description=request.POST.get("description"),
            level_id=request.POST.get("level_id") or None,
            role_id=request.POST.get("role_id") or None,
            theme_id=request.POST.get("theme_id") or None,
            type_id=request.POST.get("type_id") or None,
            video_url=request.POST.get("video_url"),
            logo=request.FILES.get("logo"),
            video_file=request.FILES.get("video_file")
        )
        
        for f in request.FILES.getlist("documents"):
            Document.objects.create(
                activity=activity,
                filename=f.name,
                file=f,
                doc_type="pdf"
            )
            
        return redirect("adventure:admin_dashboard")

    return render(
        request,
        "adventure/admin.html",
        {
            "levels": Level.objects.all(),
            "roles": Role.objects.exclude(label="admin"),
            "themes": Theme.objects.all(),
            "types": Type.objects.all(),
            "activities": Activity.objects.all().select_related(
                "level", "role", "theme", "type"
            ),
            "users_list": User.objects.exclude(is_superuser=True).select_related(
                "role", "level"
            ),
            "pending_comments": Comment.objects.filter(
                is_moderated=False
            ).select_related("user", "activity"),
        },
    )


@staff_member_required
@require_POST
def admin_activity_delete(request, activity_id):
    get_object_or_404(Activity, id=activity_id).delete()
    return redirect("adventure:admin_dashboard")


@staff_member_required
@require_POST
def admin_user_create(request):
    username = request.POST.get("username")
    password = request.POST.get("password")
    if username and password:
        User.objects.create_user(
            username=username,
            password=password,
            role_id=request.POST.get("role_id"),
            level_id=request.POST.get("level_id") or None,
        )
    return redirect("adventure:admin_dashboard")


@staff_member_required
@require_POST
def admin_user_delete(request, user_id):
    get_object_or_404(User, id=user_id).delete()
    return redirect("adventure:admin_dashboard")


@staff_member_required
@require_POST
def admin_comment_approve(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    comment.is_moderated = True
    comment.save()
    return redirect("adventure:admin_dashboard")


@staff_member_required
@require_POST
def admin_comment_delete(request, comment_id):
    get_object_or_404(Comment, id=comment_id).delete()
    return redirect("adventure:admin_dashboard")
