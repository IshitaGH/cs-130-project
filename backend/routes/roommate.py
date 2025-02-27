from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from database import db
from models.roommate import Room, Roommate

@jwt_required()
def get_roommates_in_room():
    roommate_id = get_jwt_identity()
    current_roommate = Roommate.query.get(roommate_id)
    if not current_roommate or not current_roommate.room_fkey:
        return jsonify({"message": "User is not assigned to any room"}), 404
    roommates = Roommate.query.filter_by(room_fkey=current_roommate.room_fkey).all()
    result = []
    for rm in roommates:
        result.append(
            {
                "id": rm.id,
                "first_name": rm.first_name,
                "last_name": rm.last_name,
                "username": rm.username,
                "created_at": rm.created_at.isoformat(),
                "updated_at": rm.updated_at.isoformat(),
            }
        )
    return jsonify({"roommates": result}), 200
