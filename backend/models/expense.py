from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Double,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from sqlalchemy.orm import relationship

from database import db


class Expense(db.Model):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False,
    )
    title = Column(String, nullable=False)
    cost = Column(Double, nullable=False)
    description = Column(String)
    expense_period_fkey = Column(Integer, ForeignKey("expense_periods.id"), nullable=False)
    room_fkey = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    roommate_fkey = Column(Integer, ForeignKey("roommates.id"), nullable=False)

    roommate_list = relationship(
        "Roommate", secondary="roommate_expenses", back_populates="expense_list"
    )


class Roommate_Expense(db.Model):
    __tablename__ = "roommate_expenses"

    expense_fkey = Column(ForeignKey("expenses.id"), nullable=False)
    roommate_fkey = Column(ForeignKey("roommates.id"), nullable=False)
    percentage = Column(Double, nullable=False)

    __table_args__ = (PrimaryKeyConstraint("expense_fkey", "roommate_fkey"),)


class Expense_Period(db.Model):
    __tablename__ = "expense_periods"
    id = Column(Integer, primary_key=True, nullable=False)
    room_fkey = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    open = Column(Boolean, nullable=False)
