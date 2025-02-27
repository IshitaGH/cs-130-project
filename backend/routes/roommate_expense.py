from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)


from database import db
from models.expense import Roommate_Expense, Expense
from models.roommate import Room, Roommate

@jwt_required()
def get_roommate_expense():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    roommate_expenses = Roommate_Expense.query.filter_by(roommate_fkey=roommate.id).all()

    result = []
    for roommate_expense in roommate_expenses:
        result.append(
            {
                "expense_fkey": roommate_expense.expense_fkey,
                "roommate_fkey": roommate_expense.roommate_fkey,
                "percentage": roommate_expense.percentage
            }
        )
    return jsonify(result), 200