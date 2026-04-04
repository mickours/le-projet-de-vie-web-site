from django.contrib import admin
from .models import (
    Level,
    Role,
    Theme,
    Type,
    User,
    Activity,
    Document,
    UserActivity,
    Comment,
)


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ("label",)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("label",)


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ("label",)


@admin.register(Type)
class TypeAdmin(admin.ModelAdmin):
    list_display = ("label",)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "role", "level", "age")
    list_filter = ("role", "level")
    search_fields = ("username",)


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 1


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "theme", "type", "level", "role")
    list_filter = ("theme", "type", "level", "role")
    search_fields = ("title", "description")
    inlines = [DocumentInline]


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ("user", "activity", "is_completed")
    list_filter = ("is_completed",)
    search_fields = ("user__username", "activity__title")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "activity", "is_moderated", "created_at")
    list_filter = ("is_moderated", "created_at")
    search_fields = ("user__username", "activity__title", "content")
    actions = ["approve_comments"]

    @admin.action(description="Approve selected comments")
    def approve_comments(self, request, queryset):
        queryset.update(is_moderated=True)
