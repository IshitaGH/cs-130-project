from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.roommate import Roommate

@jwt_required()
def get_roommates_in_room():
    roommate_id = int(get_jwt_identity())

    current_roommate = Roommate.query.get(roommate_id)
    if not current_roommate:
        return jsonify({"message": "User not found"}), 404

    if not current_roommate.room_fkey:
        return jsonify({"message": "User is not assigned to any room"}), 404

    roommates = Roommate.query.filter_by(room_fkey=current_roommate.room_fkey).all()

    data = []
    for rm in roommates:
        data.append(
            {
                "id": rm.id,
                "first_name": rm.first_name,
                "last_name": rm.last_name,
                "username": rm.username,
                "created_at": rm.created_at.isoformat(),
                "updated_at": rm.updated_at.isoformat(),
            }
        )
    return jsonify({"roommates": data}), 200
