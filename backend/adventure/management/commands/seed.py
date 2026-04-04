from django.core.management.base import BaseCommand
from adventure.models import Role, Level, Type, Theme, User


class Command(BaseCommand):
    help = "Seeds the database with initial data"

    def handle(self, *args, **options):
        if Role.objects.exists():
            self.stdout.write("Database already seeded.")
            return

        # Roles
        for label in [
            "admin",
            "élève",
            "parent",
            "enseignant",
            "professionnel de l'orientation",
        ]:
            Role.objects.create(label=label)

        # Levels
        for label in [
            "6ème",
            "5ème",
            "4ème",
            "3ème",
            "2nde",
            "1ère",
            "Terminale",
            "Étudiant",
            "Apprenti",
            "Autre",
        ]:
            Level.objects.create(label=label)

        # Types
        for label in ["Encadrée", "Autonomie", "Guide"]:
            Type.objects.create(label=label)

        # Themes
        for label in [
            "Métiers",
            "Formations",
            "Connaissance de Soi",
            "Projet Personnel",
        ]:
            Theme.objects.create(label=label)

        # Create Admin
        admin_role = Role.objects.get(label="admin")
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                password="admin123",
                role=admin_role,
                is_staff=True,
                is_superuser=True,
            )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
