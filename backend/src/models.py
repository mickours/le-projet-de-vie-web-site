from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
    Table,
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


user_relationships = Table(
    "user_relationships",
    Base.metadata,
    Column("parent_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("child_id", Integer, ForeignKey("users.id"), primary_key=True),
)


class Level(Base):
    __tablename__ = "levels"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(50), unique=True, nullable=False)


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(50), unique=True, nullable=False)


class Theme(Base):
    __tablename__ = "themes"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(100), unique=True, nullable=False)


class Type(Base):
    __tablename__ = "types"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(100), unique=True, nullable=False)


class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    video_url = Column(String(500), nullable=True)
    type_id = Column(Integer, ForeignKey("types.id"))
    theme_id = Column(Integer, ForeignKey("themes.id"))
    level_id = Column(Integer, ForeignKey("levels.id"))
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)

    type = relationship("Type")
    theme = relationship("Theme")
    level = relationship("Level")
    role = relationship("Role")
    documents = relationship(
        "Document", back_populates="activity", cascade="all, delete-orphan"
    )


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    doc_type = Column(String(20), default="pdf")  # 'pdf', 'video_file', 'video_link'
    activity_id = Column(Integer, ForeignKey("activities.id"))

    activity = relationship("Activity", back_populates="documents")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(50), default="👤")
    age = Column(Integer, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    level_id = Column(Integer, ForeignKey("levels.id"))

    role = relationship("Role")
    level = relationship("Level")

    children = relationship(
        "User",
        secondary=user_relationships,
        primaryjoin=id == user_relationships.c.parent_id,
        secondaryjoin=id == user_relationships.c.child_id,
        backref="parents",
    )


class UserActivity(Base):
    __tablename__ = "user_activities"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_id = Column(Integer, ForeignKey("activities.id"))
    is_completed = Column(Boolean, default=False)
    notes = Column(Text)

    activity = relationship("Activity")


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    is_moderated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    activity = relationship("Activity")
    user = relationship("User")
