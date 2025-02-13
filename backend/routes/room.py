import random
import string
from datetime import datetime

from flask import jsonify, request

from database import db
from models.roommate import Room, Roommate


def generate_invite_code(length=8):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def create_room():
    data = request.json

    if "name" not in data or not data["name"].strip():
        return jsonify({"error": "Room name is required"}), 400

    invite_code = generate_invite_code()
    # make sure no other room has the same invite code
    while Room.query.filter_by(invite_code=invite_code).first():
        invite_code = generate_invite_code()

    new_room = Room(
        name=data["name"].strip(),
        invite_code=invite_code,
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
                "invite_code": new_room.invite_code,
                "created_at": new_room.created_at.isoformat(),
                "updated_at": new_room.updated_at.isoformat(),
            }
        ),
        201,
    )


def get_room(room_id):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    room_data = {
        "id": room.id,
        "name": room.name,
        "created_at": room.created_at.isoformat(),
        "updated_at": room.updated_at.isoformat(),
        "invite_code": room.invite_code,
    }
    return jsonify(room_data)


def get_room_by_roommate():
    data = request.json

    roommate_id = data["roommate_id"]
    if not roommate_id:
        return jsonify({"error": "roommate id is required"}), 400

    roommate = Roommate.query.get(roommate_id)
    if not roommate:
        return jsonify({"error": "Roommate not found"}), 404

    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Not been assigned a room yet!"}), 404

    room_data = {
        "id": room.id,
        "name": room.name,
        "created_at": room.created_at.isoformat(),
        "updated_at": room.updated_at.isoformat(),
        "invite_code": room.invite_code,
    }
    return jsonify(room_data)
