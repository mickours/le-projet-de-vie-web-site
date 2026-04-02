from database import engine, SessionLocal
import models
from auth import get_password_hash


def seed_db():
    db = SessionLocal()

    # Check if data already exists
    if db.query(models.Role).first():
        print("Database already seeded.")
        return

    # Roles
    roles = [
        models.Role(label=label)
        for label in [
            "admin",
            "élève",
            "parent",
            "enseignant",
            "professionnel de l'orientation",
        ]
    ]
    db.add_all(roles)

    # Levels
    levels = [
        models.Level(label=label)
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
        ]
    ]
    db.add_all(levels)

    # Types of activities
    types = [models.Type(label=label) for label in ["Encadrée", "Autonomie", "Guide"]]
    db.add_all(types)

    # Themes
    themes = [
        models.Theme(label=label)
        for label in [
            "Métiers",
            "Formations",
            "Connaissance de Soi",
            "Projet Personnel",
        ]
    ]
    db.add_all(themes)

    db.commit()

    # Create an admin user
    admin_role = db.query(models.Role).filter(models.Role.label == "admin").first()
    admin_user = models.User(
        username="admin",
        password_hash=get_password_hash("admin123"),
        role_id=admin_role.id,
    )
    db.add(admin_user)
    db.commit()

    print("Database seeded successfully!")
    db.close()


if __name__ == "__main__":
    models.Base.metadata.create_all(bind=engine)
    seed_db()
