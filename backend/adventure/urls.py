from django.urls import path
from . import views

app_name = "adventure"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("home/", views.home, name="home"),
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
]
