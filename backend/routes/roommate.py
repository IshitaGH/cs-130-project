from datetime import datetime

from flask import jsonify, request

from database import db
from models.roommate import Room, Roommate


def create_roommate():
    data = request.json

    if "name" not in data or not data["name"].strip():
        return jsonify({"error": "Roommate name is required"}), 400

    new_room = Roommate(
        name=data["name"].strip(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.session.add(new_room)
    db.session.commit()

    return (
        jsonify(
            {
                "id": new_room.id,
                "name": new_room.name,
                "created_at": new_room.created_at.isoformat(),
                "updated_at": new_room.updated_at.isoformat(),
            }
        ),
        201,
    )


def join_room():
    data = request.json

    roommate_id = data["roommate_id"]
    invite_code = data["invite_code"]

    if not roommate_id:
        return jsonify({"error": "roommate id missing"}), 404

    if not invite_code:
        return jsonify({"error": "invite code is missing"}), 404

    room = Room.query.filter_by(invite_code=invite_code).first()
    if not room:
        return jsonify({"error": "room not found"}), 404

    roommate = Roommate.query.get(roommate_id)
    if not roommate:
        return jsonify({"error": "roommate not found"}), 404

    roommate.room_fkey = room.id
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Roommate successfully joined the room",
                "room_id": room.id,
                "invite_code": invite_code,
            }
        ),
        200,
    )
