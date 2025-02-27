from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)


from database import db
from models.expense import Expense, Expense_Period, Roommate_Expense
from models.roommate import Room, Roommate

@jwt_required()
def create_expense():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    
    expense_period = Expense_Period.query.filter_by(room_fkey=room.id, open=True).first()

    if not expense_period:
        return jsonify({"message": "Open expense period not found"}), 404

    data = request.get_json()
    
    new_expense = Expense(
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        title=data["title"].strip(),
        cost=data["cost"],
        description=data["description"].strip(),
        expense_period_fkey=expense_period.id,
        room_fkey=room.id,
        roommate_fkey=roommate.id
    )

    db.session.add(new_expense)
    
    expenses = data.get("expenses", [])

    roommate_expenses=[]
    for expense in expenses:
        roommate=Roommate.query.filter_by(room_fkey=room.id, username=expense.get("username").strip()).first()
        if roommate:
            new_roommate_expense = Roommate_Expense(
                expense_fkey=new_expense.id,
                roommate_fkey=roommate.id,
                percentage=expense.get("percentage")
            )
            db.session.add(new_roommate_expense)
            roommate_expenses.append(
                {
                    "expense_fkey": new_roommate_expense.expense_fkey,
                    "roommate_fkey": new_roommate_expense.roommate_fkey,
                    "percentage": new_roommate_expense.percentage
                }
            )
        else:
            return jsonify(message=f"Rooommate " + expense.get("username").strip() + " not found"), 404

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
                "expense_period_fkey": new_expense.expense_period_fkey,
                "room_fkey": new_expense.room_fkey,
                "roommate_fkey": new_expense.roommate_fkey,
                "roommate_expenses": roommate_expenses
            }
        ),
        201,
    )

@jwt_required()
def get_expense():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    expenses = Expense.query.filter_by(room_fkey=room.id).all()
    
    result = []
    for expense in expenses:
        roommate_expenses_result=[]
        for roommate_expense in expense.roommate_list:
            roommate_expenses_result.append(
                    {
                        "expense_fkey": roommate_expense.expense_fkey,
                        "roommate_fkey": roommate_expense.roommate_fkey,
                        "percentage": roommate_expense.percentage
                    }
                )
        result.append(
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
                "roommate_expenses": roommate_expenses_result
            }
        )
    return jsonify(result), 200

@jwt_required()
def update_expense():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    data = request.get_json()
    
    expense = Expense.query.filter_by(
        roommate_fkey=roommate_id,
        id=data["id"]
    ).first()
    
    if expense:
        expense.updated_at=datetime.utcnow()
        expense.title=data["title"] if "title" in data else expense.title
        expense.cost=data["cost"] if "cost" in data else expense.cost
        expense.description=data["description"].strip() if "description" in data else expense.description
        
        if "expenses" in data:
            expenses = data.get("expenses", [])
            for ex in expenses:
                roommate = Roommate.query.filter_by(room_fkey=room.id, username=ex.get("username").strip()).first()
                if roommate:
                    roommate_expense=Roommate_Expense.query.filter_by(roommate_fkey=roommate.id, expense_fkey=expense.id).first()
                    roommate_expense.percentage=ex.get("percentage")
                else:
                    return jsonify(message=f"Rooommate " + ex.get("username").strip() + " not found"), 404
    else:
        return jsonify({"message": "Expense not found"}), 404
    
    db.session.commit()
    
    roommate_expenses_result=[]
    roommate_expenses=Roommate_Expense.query.filter_by(expense_fkey=expense.id).all()
    for roommate_expense in roommate_expenses:
        roommate_expenses_result.append(
                {
                    "expense_fkey": roommate_expense.expense_fkey,
                    "roommate_fkey": roommate_expense.roommate_fkey,
                    "percentage": roommate_expense.percentage
                }
            )

    return (
        jsonify(
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
                "roommate_expenses": roommate_expenses_result
            }
        ),
        200,
    )

@jwt_required()
def remove_expense():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
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
        roommate_expenses=Roommate_Expense.query.filter_by(expense_fkey=expense.id).all()
        for roommate_expense in roommate_expenses:
            db.session.delete(roommate_expense)
        db.session.delete(expense)
        db.session.commit()
        return jsonify({"message": "Expense deleted successfully"}), 200
    else:
        return jsonify({"message": "Expense not found"}), 404