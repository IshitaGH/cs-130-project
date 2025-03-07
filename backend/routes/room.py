import random
import string
from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from database import db
from models.roommate import Room, Roommate
from models.chore import Chore


# TODO: Increase length to be more secure. Keeping it short for now for development.
def generate_invite_code(length=4):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


@jwt_required()
def get_current_room():
    roommate_id = int(get_jwt_identity())

    roommate = Roommate.query.get(roommate_id)
    if not roommate:
        return jsonify({"message": "Roommate not found"}), 404

    # If the roommate is not in a room, return None (this is still a valid response)
    if not roommate.room_fkey:
        return jsonify({"room_id": None}), 200

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
    roommate_id = int(get_jwt_identity())

    roommate = Roommate.query.get(roommate_id)
    if not roommate:
        return jsonify({"message": "Roommate not found"}), 404

    data = request.get_json()

    room_name = data.get("room_name", "").strip()
    if not room_name:
        return jsonify({"message": "Room name is required"}), 400

    invite_code = generate_invite_code()

    new_room = Room(
        name=room_name,
        invite_code=invite_code,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.session.add(new_room)
    db.session.flush()  # Ensures new_room.id is generated

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
    roommate_id = int(get_jwt_identity())

    roommate = Roommate.query.get(roommate_id)
    if not roommate:
        return jsonify({"message": "Roommate not found"}), 404

    data = request.get_json()

    invite_code = data.get("invite_code")
    if not invite_code:
        return jsonify({"message": "Invite code is required"}), 400

    room = Room.query.filter_by(invite_code=invite_code).first()
    if not room:
        return jsonify({"message": "Room not found"}), 404

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

    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    # Get all roommates in the same room
    roommates = Roommate.query.filter_by(room_fkey=roommate.room_fkey).all()
    roommate_ids = [rm.id for rm in roommates]

    # If this is the last roommate in the room
    if len(roommate_ids) == 1 and roommate_ids[0] == roommate_id:
        # Delete all chores in the room
        chores_in_room = Chore.query.filter(Chore.assignee_fkey.in_(roommate_ids)).all()
        for chore in chores_in_room:
            db.session.delete(chore)

        roommate.room_fkey = None
        db.session.delete(room)

        db.session.commit()
        return {}, 200

    # All chores where the leaving roommate is the assignee
    assigned_chores = Chore.query.filter(Chore.assignee_fkey == roommate_id).all()
    for chore in assigned_chores:
        # If the chore is recurring and the leaving roommate is in the rotation_order
        if chore.recurrence != "none" and chore.rotation_order and roommate_id in chore.rotation_order:
            # Remove the leaving roommate from rotation_order
            chore.rotation_order = [r for r in chore.rotation_order if r != roommate_id]

            # If no one is left in rotation, delete the chore
            if not chore.rotation_order:
                db.session.delete(chore)
            # Otherwise, assign the chore to the next roommate in rotation
            else:
                chore.assignee_fkey = chore.rotation_order[0]

        # If the chore is not recurring, delete it
        else:
            db.session.delete(chore)

    # All chores in the roommate's room
    remaining_chores = Chore.query.filter(Chore.assignee_fkey.in_(roommate_ids)).all()
    for chore in remaining_chores:
        # If the chore is recurring, remove the leaving roommate from the rotation_order
        if chore.recurrence != "none" and chore.rotation_order and roommate_id in chore.rotation_order:
            chore.rotation_order = [r for r in chore.rotation_order if r != roommate_id]

    roommate.room_fkey = None

    db.session.commit()

    return {}, 200
