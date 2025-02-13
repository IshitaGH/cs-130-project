import random
import string
from datetime import datetime

from flask import jsonify, request

from database import db
from models.roommate import Room


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
