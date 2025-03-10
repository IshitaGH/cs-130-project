from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import db

# from models.chore import Chore


class Notification(db.Model):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, unique=False, nullable=True)
    description = Column(String, unique=False, nullable=True)
    notification_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    notification_sender = Column(Integer, ForeignKey("roommates.id"), nullable=True)
    notification_recipient = Column(Integer, ForeignKey("roommates.id"), nullable=True)
    room_fkey = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
