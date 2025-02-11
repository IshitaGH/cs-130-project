from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import db


class Room(db.Model):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, unique=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False,
    )
    invite_code = Column(String, nullable=False, unique=True)


class Roommate(db.Model):
    __tablename__ = "roommates"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, unique=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False,
    )
    room_fkey = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    # TODO: password auth

    expense_list = relationship(
        "Expense", secondary="roommate_expenses", back_populates="roommate_list"
    )

    chores = relationship(
        "chores", foreign_keys="[chores.assignee_fkey]", back_populates="assignee"
    )
