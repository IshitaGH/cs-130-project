from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import db
#from models.chore import Chore


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
    first_name = Column(String, nullable=False)  # new field for first name
    last_name = Column(String, nullable=False)  # new field for last name
    username = Column(String, unique=True, nullable=False)  # unique username for login
    password_hash = Column(String, nullable=False)  # hashed password
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False,
    )
    room_fkey = Column(Integer, ForeignKey("rooms.id"), nullable=True)

    expense_list = relationship(
        "Expense", secondary="roommate_expenses", back_populates="roommate_list"
    )
    # Explicitly define the relationship for chores assigned to this roommate.
    chores = relationship(
        "Chore",
        primaryjoin="Roommate.id == Chore.assignee_fkey",
        foreign_keys="[Chore.assignee_fkey]",
        back_populates="assignee"
    )
