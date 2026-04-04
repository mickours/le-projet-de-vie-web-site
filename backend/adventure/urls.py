from django.urls import path
from . import views

app_name = "adventure"

urlpatterns = [
    path("", views.home, name="home"),
    path("adventure/", views.dashboard, name="dashboard"),
    path("register/", views.register, name="register"),
    path("activities/", views.activity_list, name="activity_list"),
    path(
        "activities/<int:activity_id>/", views.activity_detail, name="activity_detail"
    ),
    path(
        "activities/<int:activity_id>/progress/",
        views.save_progress,
        name="save_progress",
    ),
    path(
        "activities/<int:activity_id>/comment/", views.add_comment, name="add_comment"
    ),
    path("dossier/", views.dossier, name="dossier"),
    path("profile/", views.profile, name="profile"),
    # Custom Admin
    path("dashboard/admin/", views.admin_dashboard, name="admin_dashboard"),
    path(
        "dashboard/admin/activity/delete/<int:activity_id>/",
        views.admin_activity_delete,
        name="admin_activity_delete",
    ),
    path(
        "dashboard/admin/user/create/",
        views.admin_user_create,
        name="admin_user_create",
    ),
    path(
        "dashboard/admin/user/delete/<int:user_id>/",
        views.admin_user_delete,
        name="admin_user_delete",
    ),
    path(
        "dashboard/admin/comment/approve/<int:comment_id>/",
        views.admin_comment_approve,
        name="admin_comment_approve",
    ),
    path(
        "dashboard/admin/comment/delete/<int:comment_id>/",
        views.admin_comment_delete,
        name="admin_comment_delete",
    ),
]
