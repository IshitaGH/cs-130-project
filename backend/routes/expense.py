from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)


from database import db
from models.expense import Expense
from models.roommate import Room, Roommate

@jwt_required()
def create_expense():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 200
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    data = request.get_json()

    new_expense = Expense(
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        title=data["title"].strip(),
        cost=data["cost"],
        description=data["description"].strip(),
        room_fkey=room.id,
        roommate_fkey=roommate.id
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