from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from database import db
from models.expense import Expense, Expense_Period
from models.roommate import Room, Roommate


@jwt_required()
def create_expense_period():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    new_expense_period = Expense_Period(
        room_fkey=room.id,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow(),
        open=True,
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
                "open": new_expense_period.open,
            }
        ),
        201,
    )


@jwt_required()
def get_expense_period():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    expense_periods = Expense_Period.query.filter_by(room_fkey=room.id).all()

    expense_period_result = []
    for expense_period in expense_periods:
        expense_result = []
        expenses = Expense.query.filter_by(expense_period_fkey=expense_period.id).all()
        for expense in expenses:
            expense_result.append(
                {
                    "id": expense.id,
                    "title": expense.title,
                    "created_at": expense.created_at.isoformat(),
                    "updated_at": expense.updated_at.isoformat(),
                    "cost": expense.cost,
                    "description": expense.description,
                    "expense_period_fkey": expense.expense_period_fkey,
                    "room_fkey": expense.room_fkey,
                    "roommate_fkey": expense.roommate_fkey,
                }
            )
        expense_period_result.append(
            {
                "id": expense_period.id,
                "room_fkey": expense_period.room_fkey,
                "start_date": expense_period.start_date.isoformat(),
                "end_date": expense_period.end_date.isoformat(),
                "expenses": expense_result,
                "open": expense_period.open,
            }
        )
    return jsonify(expense_period_result), 200


@jwt_required()
def close_expense_period():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    expense_period = Expense_Period.query.filter_by(
        room_fkey=room.id, open=True
    ).first()

    if expense_period:
        expense_period.open = False
        expense_period.end_date = datetime.utcnow()
        db.session.commit()
        return create_expense_period()
    else:
        return jsonify({"message": "Open expense period not found"}), 404


@jwt_required()
def delete_expense_period():
    data = request.get_json()

    expense_period = Expense_Period.query.filter_by(id=data["id"]).first()

    expenses = Expense.query.filter_by(expense_period_fkey=expense_period.id).all()

    if expense_period:
        for expense in expenses:
            db.session.delete(expense)
        db.session.delete(expense_period)
        db.session.commit()
        return jsonify({"message": "Expense period deleted successfully"}), 200
    else:
        return jsonify({"message": "Expense period not found"}), 404
