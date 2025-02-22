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

@jwt_required()
def get_expense():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 200
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    expenses = Expense.query.filter_by(roommate_fkey=roommate.id).all()

    result = []
    for expense in expenses:
        result.append(
            {
                "id": expense.id,
                "title": expense.title,
                "created_at": expense.created_at.isoformat(),
                "updated_at": expense.updated_at.isoformat(),
                "cost": expense.cost,
                "description": expense.description,
                "room_fkey": expense.room_fkey,
                "roommate_fkey": expense.roommate_fkey
            }
        )
    return jsonify(result), 200

@jwt_required()
def update_expense():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 200
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    data = request.get_json()
    
    expense = Expense.query.filter_by(
        roommate_fkey=roommate_id, 
        room_fkey=room.id,
        title=data["title"].strip()
    ).first()
    
    if expense:
        expense.updated_at=datetime.utcnow()
        expense.cost=data["cost"]
        expense.description=data["description"].strip()
    else:
        return jsonify({"message": "Expense not found"}), 4404
    
    return (
        jsonify(
            {
                "id": expense.id,
                "title": expense.title,
                "created_at": expense.created_at.isoformat(),
                "updated_at": expense.updated_at.isoformat(),
                "cost": expense.cost,
                "description": expense.description,
                "room_fkey": expense.room_fkey,
                "roommate_fkey": expense.roommate_fkey
            }
        ),
        201,
    )