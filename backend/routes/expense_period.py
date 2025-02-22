from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)


from database import db
from models.expense import Expense_Period, Expense
from models.roommate import Room, Roommate

@jwt_required()
def create_expense_period():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 200
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    data = request.get_json()
    
    new_expense_period = Expense_Period(
        room_fkey=room.id,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow(),
        open=data["open"]
    )

    db.session.add(new_expense_period)
    db.session.commit()

    return (
        jsonify(
            {
                "id": new_expense_period.id,
                "room_fkey": new_expense_period.room_fkey,
                "start_date": new_expense_period.start_date.isoformat(),
                "end_date": new_expense_period.end_date.isoformat(),
                "open": new_expense_period.open
            }
        ),
        201,
    )