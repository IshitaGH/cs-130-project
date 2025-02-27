import random
import string
from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from database import db
from models.roommate import Room, Roommate


def generate_invite_code(length=8):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


@jwt_required()
def get_current_room():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    return (
        jsonify(
            {
                "room_id": room.id,
                "name": room.name,
                "invite_code": room.invite_code,
                "created_at": room.created_at.isoformat(),
                "updated_at": room.updated_at.isoformat(),
            }
        ),
        200,
    )


@jwt_required()
def create_room():
    roommate_id = get_jwt_identity()
    data = request.get_json()
    room_name = data.get("room_name", "").strip()
    if not room_name:
        return jsonify({"message": "Room name is required"}), 400

    invite_code = generate_invite_code()
    while Room.query.filter_by(invite_code=invite_code).first():
        invite_code = generate_invite_code()

    new_room = Room(
        name=room_name,
        invite_code=invite_code,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(new_room)
    db.session.flush()  # Ensures new_room.id is generated

    roommate = Roommate.query.get(roommate_id)
    roommate.room_fkey = new_room.id
    db.session.commit()

    return (
        jsonify(
            {
                "room_id": new_room.id,
                "name": new_room.name,
                "invite_code": new_room.invite_code,
                "created_at": new_room.created_at.isoformat(),
                "updated_at": new_room.updated_at.isoformat(),
            }
        ),
        201,
    )


@jwt_required()
def join_room():
    roommate_id = get_jwt_identity()
    data = request.get_json()
    invite_code = data.get("invite_code")
    if not invite_code:
        return jsonify({"message": "Invite code is required"}), 400

    room = Room.query.filter_by(invite_code=invite_code).first()
    if not room:
        return jsonify({"message": "Room not found"}), 404

    roommate = Roommate.query.get(roommate_id)
    roommate.room_fkey = room.id
    db.session.commit()

    return (
        jsonify(
            {
                "room_id": room.id,
                "name": room.name,
                "invite_code": room.invite_code,
                "created_at": room.created_at.isoformat(),
                "updated_at": room.updated_at.isoformat(),
            }
        ),
        200,
    )


@jwt_required()
def leave_room():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate:
        return jsonify({"message": "Roommate record not found"}), 404

    roommate.room_fkey = None
    db.session.commit()
    return {}, 200


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
    return jsonify(result), 200
