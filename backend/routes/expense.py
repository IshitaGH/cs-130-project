from datetime import datetime

from flask import jsonify, request

from database import db
from models.expense import Expense


def create_expense():
    data = request.get_json()

    new_expense = Expense(
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        title=data["title"].strip(),
        cost=data["cost"],
        description=data["description"].strip(),
        room_fkey=data["room_fkey"],
        roommate_fkey=data["roommate_fkey"]
    )

    db.session.add(new_expense)
    db.session.commit()

    return (
        jsonify(
            {
                "id": new_expense.id,
                "title": new_expense.title,
                "created_at": new_expense.created_at.isoformat(),
                "updated_at": new_expense.updated_at.isoformat(),
                "cost": new_expense.cost,
                "description": new_expense.description,
                "room_fkey": new_expense.room_fkey,
                "roommate_fkey": new_expense.roommate_fkey
            }
        ),
        201,
    )
