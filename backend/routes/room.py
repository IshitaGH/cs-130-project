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
from models.chore import Chore


def generate_invite_code(length=4):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


@jwt_required()
def get_current_room():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 200 # This is a valid response
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
    roommate_id = int(get_jwt_identity())
    roommate = Roommate.query.get(roommate_id)

    if not roommate:
        return jsonify({"message": "Roommate record not found"}), 404

    if not roommate.room_fkey:
        return jsonify({"message": "Roommate is not in a room"}), 400

    # Get all roommates in the same room
    roommates = Roommate.query.filter_by(room_fkey=roommate.room_fkey).all()
    roommate_ids = [rm.id for rm in roommates]

    # If this is the last roommate in the room, delete the room and all its chores
    if len(roommate_ids) == 1 and roommate_ids[0] == roommate_id:
        chores_in_room = Chore.query.filter(Chore.assignee_fkey.in_(roommate_ids)).all()
        for chore in chores_in_room:
            db.session.delete(chore)

        room_to_delete = Room.query.get(roommate.room_fkey)
        roommate.room_fkey = None
        db.session.delete(room_to_delete)
        db.session.commit()
        return {}, 200

    # 1) Get all chores where the leaving roommate is the assignee
    assigned_chores = Chore.query.filter(Chore.assignee_fkey == roommate_id).all()

    for chore in assigned_chores:
        if chore.recurrence != "none" and chore.rotation_order and roommate_id in chore.rotation_order:
            # Remove the leaving roommate from rotation_order
            chore.rotation_order = [r for r in chore.rotation_order if r != roommate_id]

            if not chore.rotation_order:
                # If no one is left in rotation, delete the chore
                db.session.delete(chore)
            else:
                # Otherwise, assign the next roommate in rotation
                chore.assignee_fkey = chore.rotation_order[0]
        else:
            # If there's no rotation_order, delete the chore
            db.session.delete(chore)

    # 2) Update all remaining chores in the room that include the leaving roommate in `rotation_order`
    remaining_chores = Chore.query.filter(Chore.assignee_fkey.in_(roommate_ids)).all()

    for chore in remaining_chores:
        if chore.recurrence != "none" and chore.rotation_order and roommate_id in chore.rotation_order:
            print(f"chore.rotation_order before: {chore.rotation_order}")
            chore.rotation_order = [r for r in chore.rotation_order if r != roommate_id]
            print(f"chore.rotation_order after: {chore.rotation_order}")

    roommate.room_fkey = None

    db.session.commit()

    return {}, 200
