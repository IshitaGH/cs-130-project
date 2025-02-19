from datetime import datetime

from flask import jsonify, request

from database import db
from models.roommate import Roommate


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
