from datetime import datetime, timedelta

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Interval, String
from sqlalchemy.orm import relationship

from database import db
from models.roommate import Roommate


class Chore(db.Model):
    __tablename__ = "chores"

    id = Column(Integer, primary_key=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.now,
        nullable=False,
        onupdate=datetime.now,
    )
    start_date = Column(
        DateTime, default=datetime.utcnow, nullable=False
    )  # auto-set at creation (should be midnight)
    end_date = Column(DateTime, nullable=False)
    autorotate = Column(Boolean, nullable=False)
    is_task = Column(Boolean, default=False, nullable=False)
    completed = Column(Boolean, nullable=True)
    # use as title
    description = Column(String, nullable=True)
    recurrence = Column(String, nullable=False)

    assignee_fkey = Column(Integer, ForeignKey("roommates.id"), nullable=False)
    assignor_fkey = Column(Integer, ForeignKey("roommates.id"), nullable=False)

    assignee = relationship(
        "Roommate", foreign_keys=[assignee_fkey], back_populates="chores"
    )
