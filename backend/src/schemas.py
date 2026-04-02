from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# --- Role & Level Schemas ---
class RoleBase(BaseModel):
    label: str


class Role(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LevelBase(BaseModel):
    label: str


class Level(LevelBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ThemeBase(BaseModel):
    label: str


class Theme(ThemeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class TypeBase(BaseModel):
    label: str


class Type(TypeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# --- User Schemas ---
class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    role_id: int
    level_id: Optional[int] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None
    age: Optional[int] = None
    role_id: Optional[int] = None
    level_id: Optional[int] = None
    password: Optional[str] = None


class PasswordReset(BaseModel):
    new_password: str


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    avatar: Optional[str] = "👤"
    age: Optional[int] = None
    role_id: int
    level_id: Optional[int] = None
    role: Optional[Role] = None
    level: Optional[Level] = None
    children: List["User"] = []


class UserWithToken(BaseModel):
    user: User
    access_token: Optional[str] = None
    token_type: Optional[str] = None


# --- Document Schemas ---
class DocumentBase(BaseModel):
    filename: str
    url: str
    doc_type: str = "pdf"


class Document(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    activity_id: int


# --- Activity Schemas ---
class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    logo_url: Optional[str] = None
    type_id: int
    theme_id: int
    level_id: int
    role_id: Optional[int] = None


class Activity(ActivityBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: Optional[Type] = None
    theme: Optional[Theme] = None
    level: Optional[Level] = None
    role: Optional[Role] = None
    documents: List[Document] = []


# --- UserActivity Schemas (Dossier Personnel) ---
class UserActivityBase(BaseModel):
    activity_id: int
    is_completed: bool = False
    notes: Optional[str] = None


class UserActivityCreate(UserActivityBase):
    pass


class UserActivity(UserActivityBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    activity: Optional[Activity] = None


# --- Comment Schemas ---
class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    activity_id: int


class Comment(CommentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    activity_id: int
    user_id: int
    is_moderated: bool
    created_at: datetime
    username: Optional[str] = None


# --- Config Schemas ---
class Config(BaseModel):
    tinymce_api_key: str
