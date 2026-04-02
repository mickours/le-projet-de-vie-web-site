import os
from typing import Optional, List
from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

from database import get_db
from config import settings
import models
import schemas
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)


app = FastAPI(
    title="L'aventure de l'Orientation",
    description="Plateforme éducative d'orientation avec un style Manga.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
frontend_path = settings.FRONTEND_PATH or os.path.join(BASE_DIR, "frontend")
uploads_path = settings.UPLOADS_PATH or os.path.join(BASE_DIR, "backend", "uploads")

if not os.path.exists(uploads_path):
    os.makedirs(uploads_path, exist_ok=True)

app.mount("/frontend", StaticFiles(directory=frontend_path), name="frontend")
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(os.path.join(frontend_path, "favicon.svg"))


# --- Config ---


@app.get("/api/config", response_model=schemas.Config, tags=["Config"])
async def get_app_config():
    """
    Expose public configurations
    """
    return {"tinymce_api_key": settings.TINYMCE_API_KEY}


# --- Authentication ---


@app.post("/token", response_model=schemas.Token, tags=["Auth"])
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = (
        db.query(models.User).filter(models.User.username == form_data.username).first()
    )
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/register", response_model=schemas.User, tags=["Auth"])
async def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = (
        db.query(models.User).filter(models.User.username == user_in.username).first()
    )
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Verify role exists
    role = db.query(models.Role).filter(models.Role.id == user_in.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Role does not exist")

    # If level is provided, verify it exists
    if user_in.level_id:
        level = (
            db.query(models.Level).filter(models.Level.id == user_in.level_id).first()
        )
        if not level:
            raise HTTPException(status_code=400, detail="Level does not exist")

    new_user = models.User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        role_id=user_in.role_id,
        level_id=user_in.level_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/users/me", response_model=schemas.User, tags=["User"])
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.put("/users/me", response_model=schemas.UserWithToken, tags=["User"])
async def update_users_me(
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_token = None

    if user_in.username is not None and user_in.username != current_user.username:
        # Check if username is taken
        existing_user = (
            db.query(models.User)
            .filter(models.User.username == user_in.username)
            .first()
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_in.username
        # Generate new token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_token = create_access_token(
            data={"sub": current_user.username}, expires_delta=access_token_expires
        )

    if user_in.avatar is not None:
        current_user.avatar = user_in.avatar

    if user_in.age is not None:
        current_user.age = user_in.age

    if user_in.role_id is not None:
        role = db.query(models.Role).filter(models.Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Role does not exist")
        current_user.role_id = user_in.role_id

    if user_in.level_id is not None:
        level = (
            db.query(models.Level).filter(models.Level.id == user_in.level_id).first()
        )
        if not level:
            raise HTTPException(status_code=400, detail="Level does not exist")
        current_user.level_id = user_in.level_id

    if user_in.password is not None:
        current_user.password_hash = get_password_hash(user_in.password)

    db.commit()
    db.refresh(current_user)

    return {
        "user": current_user,
        "access_token": new_token,
        "token_type": "bearer" if new_token else None,
    }


# --- Metadata (Roles, Levels, Themes, Types) ---


@app.get("/roles", response_model=list[schemas.Role], tags=["Metadata"])
async def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()


@app.get("/levels", response_model=list[schemas.Level], tags=["Metadata"])
async def get_levels(db: Session = Depends(get_db)):
    return db.query(models.Level).all()


@app.get("/themes", tags=["Metadata"])
async def get_themes(db: Session = Depends(get_db)):
    return db.query(models.Theme).all()


@app.get("/types", tags=["Metadata"])
async def get_types(db: Session = Depends(get_db)):
    return db.query(models.Type).all()


# --- Admin Check ---


async def get_current_admin(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    admin_role = db.query(models.Role).filter(models.Role.label == "admin").first()
    if current_user.role_id != admin_role.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


# --- Activities ---


@app.get("/activities", response_model=list[schemas.Activity], tags=["Activities"])
async def list_activities(
    level_id: Optional[int] = None,
    theme_id: Optional[int] = None,
    type_id: Optional[int] = None,
    role_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Activity)
    if level_id:
        query = query.filter(models.Activity.level_id == level_id)
    if theme_id:
        query = query.filter(models.Activity.theme_id == theme_id)
    if type_id:
        query = query.filter(models.Activity.type_id == type_id)
    if role_id:
        query = query.filter(models.Activity.role_id == role_id)
    return query.all()


@app.post("/activities", response_model=schemas.Activity, tags=["Activities"])
async def create_activity(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    level_id: int = Form(...),
    theme_id: int = Form(...),
    type_id: int = Form(...),
    role_id: Optional[int] = Form(None),
    video_links: List[str] = Form([]),
    logo: Optional[UploadFile] = File(None),
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    # Total resources limit check
    total_resources = len([f for f in files if f.filename]) + len(
        [v for v in video_links if v.strip()]
    )
    if total_resources > 10:
        raise HTTPException(
            status_code=400, detail="Maximum 10 resources allowed per quest"
        )

    logo_url = None
    if logo and logo.filename:
        logo_filename = f"logo_{logo.filename}"
        logo_location = os.path.join(uploads_path, logo_filename)
        with open(logo_location, "wb") as f:
            f.write(await logo.read())
        logo_url = f"/uploads/{logo_filename}"

    db_activity = models.Activity(
        title=title,
        description=description,
        level_id=level_id,
        theme_id=theme_id,
        type_id=type_id,
        role_id=role_id,
        logo_url=logo_url,
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    # Process Video Links
    for link in video_links:
        if not link.strip():
            continue
        db_doc = models.Document(
            filename="Vidéo (Lien)",
            url=link.strip(),
            doc_type="video_link",
            activity_id=db_activity.id,
        )
        db.add(db_doc)

    # Process Files
    for file in files:
        if not file.filename:
            continue
        file_location = os.path.join(uploads_path, file.filename)
        with open(file_location, "wb") as buffer:
            buffer.write(await file.read())

        # Determine doc_type based on extension
        ext = os.path.splitext(file.filename)[1].lower()
        doc_type = "pdf"
        if ext in [".mp4", ".webm", ".ogg", ".mov", ".avi"]:
            doc_type = "video_file"

        db_doc = models.Document(
            filename=file.filename,
            url=f"/uploads/{file.filename}",
            doc_type=doc_type,
            activity_id=db_activity.id,
        )
        db.add(db_doc)

    db.commit()
    db.refresh(db_activity)
    return db_activity


@app.get(
    "/activities/{activity_id}", response_model=schemas.Activity, tags=["Activities"]
)
async def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = (
        db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@app.put(
    "/activities/{activity_id}", response_model=schemas.Activity, tags=["Activities"]
)
async def update_activity(
    activity_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    level_id: int = Form(...),
    theme_id: int = Form(...),
    type_id: int = Form(...),
    role_id: Optional[int] = Form(None),
    video_links: List[str] = Form([]),
    logo: Optional[UploadFile] = File(None),
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    activity = (
        db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Limit check including existing documents
    new_resources_count = len([f for f in files if f.filename]) + len(
        [v for v in video_links if v.strip()]
    )
    if len(activity.documents) + new_resources_count > 10:
        raise HTTPException(
            status_code=400, detail="Maximum 10 resources allowed per quest"
        )

    activity.title = title
    activity.description = description
    activity.level_id = level_id
    activity.theme_id = theme_id
    activity.type_id = type_id
    activity.role_id = role_id

    # Process Video Links
    for link in video_links:
        if not link.strip():
            continue
        db_doc = models.Document(
            filename="Vidéo (Lien)",
            url=link.strip(),
            doc_type="video_link",
            activity_id=activity.id,
        )
        db.add(db_doc)

    # Process Files
    for file in files:
        if not file.filename:
            continue
        file_location = os.path.join(uploads_path, file.filename)
        with open(file_location, "wb") as buffer:
            buffer.write(await file.read())

        ext = os.path.splitext(file.filename)[1].lower()
        doc_type = "pdf"
        if ext in [".mp4", ".webm", ".ogg", ".mov", ".avi"]:
            doc_type = "video_file"

        db_doc = models.Document(
            filename=file.filename,
            url=f"/uploads/{file.filename}",
            doc_type=doc_type,
            activity_id=activity.id,
        )
        db.add(db_doc)

    db.commit()
    db.refresh(activity)
    return activity


@app.delete("/documents/{document_id}", tags=["Activities"])
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    document = (
        db.query(models.Document).filter(models.Document.id == document_id).first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Optionally delete the file from disk if it's a file
    if document.doc_type in ["pdf", "video_file"]:
        filename = os.path.basename(document.url)
        file_path = os.path.join(uploads_path, filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(document)
    db.commit()
    return {"status": "Document deleted"}


@app.delete("/activities/{activity_id}", tags=["Activities"])
async def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    activity = (
        db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(activity)
    db.commit()
    return {"status": "Activity deleted"}


# --- User Activities (Dossier Personnel) ---


@app.get("/dossier", response_model=list[schemas.UserActivity], tags=["Dossier"])
async def get_dossier_data(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # Get all activities for the user's level
    level_activities = (
        db.query(models.Activity)
        .options(joinedload(models.Activity.theme))
        .filter(models.Activity.level_id == current_user.level_id)
        .all()
    )

    # Get all the user's existing tracking data (could be from any level)
    user_tracks = (
        db.query(models.UserActivity)
        .options(
            joinedload(models.UserActivity.activity).joinedload(models.Activity.theme)
        )
        .filter(models.UserActivity.user_id == current_user.id)
        .all()
    )

    # Map tracked activities for easy check
    tracks_map = {t.activity_id: t for t in user_tracks}
    added_activity_ids = set()
    result = []

    # 1. Add all activities for the current level (pre-populate)
    for activity in level_activities:
        if activity.id in tracks_map:
            result.append(tracks_map[activity.id])
        else:
            # Create a "virtual" record for activities not yet started in this level
            result.append(
                models.UserActivity(
                    id=-activity.id,  # Virtual ID
                    user_id=current_user.id,
                    activity_id=activity.id,
                    activity=activity,
                    is_completed=False,
                    notes="",
                )
            )
        added_activity_ids.add(activity.id)

    # 2. Add any other activities the user has interacted with (from previous levels)
    for track in user_tracks:
        if track.activity_id not in added_activity_ids:
            result.append(track)

    return result


@app.post(
    "/activities/{activity_id}/track",
    response_model=schemas.UserActivity,
    tags=["Dossier"],
)
async def track_activity(
    activity_id: int,
    track_in: schemas.UserActivityCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if activity exists
    activity = (
        db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Update or Create tracking entry
    db_track = (
        db.query(models.UserActivity)
        .filter(
            models.UserActivity.user_id == current_user.id,
            models.UserActivity.activity_id == activity_id,
        )
        .first()
    )

    if db_track:
        db_track.is_completed = track_in.is_completed
        db_track.notes = track_in.notes
    else:
        db_track = models.UserActivity(
            user_id=current_user.id,
            activity_id=activity_id,
            is_completed=track_in.is_completed,
            notes=track_in.notes,
        )
        db.add(db_track)

    db.commit()
    db.refresh(db_track)
    return db_track


# --- Comments ---


@app.get(
    "/activities/{activity_id}/comments",
    response_model=list[schemas.Comment],
    tags=["Comments"],
)
async def list_comments(activity_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(models.Comment)
        .filter(
            models.Comment.activity_id == activity_id,
            models.Comment.is_moderated.is_(True),
        )
        .all()
    )

    # Attach username for display
    for comment in comments:
        user = db.query(models.User).filter(models.User.id == comment.user_id).first()
        comment.username = user.username if user else "Inconnu"

    return comments


@app.post(
    "/activities/{activity_id}/comments",
    response_model=schemas.Comment,
    tags=["Comments"],
)
async def create_comment(
    activity_id: int,
    comment_in: schemas.CommentBase,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_comment = models.Comment(
        activity_id=activity_id,
        user_id=current_user.id,
        content=comment_in.content,
        is_moderated=False,  # Needs approval
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


# --- Moderation (Admin only) ---


@app.get(
    "/admin/comments/pending", response_model=list[schemas.Comment], tags=["Admin"]
)
async def list_pending_comments(
    admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    comments = (
        db.query(models.Comment).filter(models.Comment.is_moderated.is_(False)).all()
    )
    for comment in comments:
        user = db.query(models.User).filter(models.User.id == comment.user_id).first()
        comment.username = user.username if user else "Inconnu"
    return comments


@app.post("/admin/comments/{comment_id}/approve", tags=["Admin"])
async def approve_comment(
    comment_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.is_moderated = True
    db.commit()
    return {"status": "Comment approved"}


@app.delete("/admin/comments/{comment_id}", tags=["Admin"])
async def delete_comment(
    comment_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
    return {"status": "Comment deleted"}


# --- User Management (Admin only) ---


@app.get("/admin/users", response_model=list[schemas.User], tags=["Admin"])
async def list_users(
    admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    return db.query(models.User).all()


@app.delete("/admin/users/{user_id}", tags=["Admin"])
async def delete_user(
    user_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"status": "User deleted"}


@app.put("/admin/users/{user_id}/reset-password", tags=["Admin"])
async def reset_user_password(
    user_id: int,
    reset_in: schemas.PasswordReset,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(reset_in.new_password)
    db.commit()
    return {"status": "Password reset successful"}


@app.post("/admin/users/{parent_id}/children/{child_id}", tags=["Admin"])
async def associate_child(
    parent_id: int,
    child_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    parent = db.query(models.User).filter(models.User.id == parent_id).first()
    child = db.query(models.User).filter(models.User.id == child_id).first()
    if not parent or not child:
        raise HTTPException(status_code=404, detail="User not found")

    if child not in parent.children:
        parent.children.append(child)
        db.commit()
    return {"status": "Child associated"}


@app.delete("/admin/users/{parent_id}/children/{child_id}", tags=["Admin"])
async def disassociate_child(
    parent_id: int,
    child_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    parent = db.query(models.User).filter(models.User.id == parent_id).first()
    child = db.query(models.User).filter(models.User.id == child_id).first()
    if not parent or not child:
        raise HTTPException(status_code=404, detail="User not found")

    if child in parent.children:
        parent.children.remove(child)
        db.commit()
    return {"status": "Child disassociated"}


@app.get("/admin")
async def admin_page():
    admin_path = os.path.join(frontend_path, "admin.html")
    if os.path.exists(admin_path):
        return FileResponse(admin_path)
    return {"message": "Admin page not found"}


@app.get("/")
async def root():
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Landing page not found"}


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # If the path looks like a file or an internal path, let static mount/404 handle it
    if "." in full_path or full_path.startswith(("uploads", "frontend")):
        raise HTTPException(status_code=404)

    adventure_path = os.path.join(frontend_path, "adventure.html")
    if os.path.exists(adventure_path):
        return FileResponse(adventure_path)
    return {"message": "Adventure app file not found"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
