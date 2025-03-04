from datetime import datetime, timedelta, timezone

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy import func

from database import db
from models.chore import Chore, Roommate


# GET /chores
# Returns all active (not completed) chores in the current user's room.
@jwt_required()
def get_chores():
    current_roommate_id = get_jwt_identity()
    current_roommate = Roommate.query.get(current_roommate_id)
    if not current_roommate or not current_roommate.room_fkey:
        return jsonify({"chores": []}), 200  # No room, so no chores

    # Get all roommate IDs in the same room
    roommates = Roommate.query.filter_by(room_fkey=current_roommate.room_fkey).all()
    roommate_ids = [rm.id for rm in roommates]

    # 1) Filter chores in the active window for the room
    # active meaning start_date <= now() <= end_date
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)

    # Filter chores in the active window for the room
    # active meaning start_date <= now_utc <= end_date
    active_window_chores = Chore.query.filter(
        Chore.assignee_fkey.in_(roommate_ids),
        Chore.start_date <= now_utc,
        now_utc <= Chore.end_date
    ).all()

    # 2) separate incomplete vs. completed
    incomplete_chores = []
    completed_chores = []
    for chore in active_window_chores:
        if chore.completed:
            completed_chores.append(chore)
        else:
            incomplete_chores.append(chore)

    # 3) Combine so incomplete come first, completed after
    active_chores = incomplete_chores + completed_chores

    chores_list = []
    for chore in active_chores:
        assigned_roommate_data = None
        if chore.assignee:
            assigned_roommate_data = {
                "id": chore.assignee.id,
                "first_name": chore.assignee.first_name,
                "last_name": chore.assignee.last_name,
                # etc. add fields we want. can change in future
            }
        chore_data = {
            "id": chore.id,
            # times in DB do not have timezone info, so we need to add it back before sending to FE
            "created_at": chore.created_at.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
            "updated_at": chore.updated_at.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
            "description": chore.description,
            "start_date": chore.start_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
            "end_date": chore.end_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
            "is_task": chore.is_task,
            "completed": chore.completed,
            "room_id": current_roommate.room_fkey,
            "assigned_roommate": assigned_roommate_data,
            "roommate_assignor_id": chore.assignor_fkey,
            "rotation_order": chore.rotation_order,
            "recurrence": chore.recurrence,
        }
        chores_list.append(chore_data)

    return jsonify({"chores": chores_list}), 200


# POST /chores
# Creates a new chore.
@jwt_required()
def create_chore():
    current_roommate_id = get_jwt_identity()
    current_roommate = Roommate.query.get(current_roommate_id)
    if not current_roommate or not current_roommate.room_fkey:
        return jsonify({"message": "User is not in a room"}), 400

    data = request.get_json()
    description = data.get("description")
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    is_task = data.get("is_task")
    recurrence = data.get("recurrence")
    assigned_roommate_id = data.get("assigned_roommate_id")
    rotation_order = data.get("rotation_order")

    if not all([description, end_date_str, is_task is not None, recurrence]):
        return jsonify({"message": "Missing required fields"}), 400

    # Parse start and end dates from the provided string
    try:
        start_date = datetime.fromisoformat(start_date_str).replace(tzinfo=None)
        end_date = datetime.fromisoformat(end_date_str).replace(tzinfo=None)
    except Exception:
        return jsonify({"message": "Invalid start_date or end_date format"}), 400

    new_chore = Chore(
        description=description,
        start_date=start_date,
        end_date=end_date,
        is_task=is_task,
        completed=False,
        assignor_fkey=current_roommate_id,  # using the current user as assignor
        assignee_fkey=assigned_roommate_id,
        recurrence=recurrence,
        rotation_order=rotation_order
    )

    db.session.add(new_chore)
    db.session.commit()

    # If we want to return a duration string for the frontend
    # duration_str = str(new_chore.end_date - new_chore.start_date)

    assigned_roommate_data = None
    if new_chore.assignee:
        assigned_roommate_data = {
            "id": new_chore.assignee.id,
            "first_name": new_chore.assignee.first_name,
            "last_name": new_chore.assignee.last_name,
        }

    chore_data = {
        "id": new_chore.id,
        "created_at": new_chore.created_at.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "updated_at": new_chore.updated_at.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "description": new_chore.description,
        "start_date": new_chore.start_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "end_date": new_chore.end_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "is_task": new_chore.is_task,
        "completed": new_chore.completed,
        "assigned_roommate": assigned_roommate_data,
        "roommate_assignor_id": new_chore.assignor_fkey,
        "room_id": current_roommate.room_fkey,
        "recurrence": new_chore.recurrence,
        "rotation_order": new_chore.rotation_order,
    }

    return jsonify({"chore": chore_data}), 201


# PUT /chores/<int:chore_id>
# Updates an existing chore.
@jwt_required()
def update_chore(chore_id):
    current_roommate_id = get_jwt_identity()
    current_roommate = Roommate.query.get(current_roommate_id)
    if not current_roommate or not current_roommate.room_fkey:
        return jsonify({"message": "User is not in a room"}), 400

    chore = Chore.query.get(chore_id)
    if not chore:
        return jsonify({"message": "Chore not found"}), 404

    data = request.get_json()
    description = data.get("description")
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    is_task = data.get("is_task")
    recurrence = data.get("recurrence")
    completed = data.get("completed")
    rotation_order = data.get("rotation_order")
    assigned_roommate_id = data.get("assigned_roommate_id")

    # Update rotation_order and assignee_fkey together if rotation_order is provided
    if rotation_order is not None:
        chore.rotation_order = rotation_order
        # If rotation_order is not empty, set assignee_fkey to the first person in the list
        if rotation_order:
            chore.assignee_fkey = rotation_order[0]
    # If this is not a recurring chore (no rotation_order) and assigned_roommate_id is provided
    elif assigned_roommate_id is not None:
        chore.assignee_fkey = assigned_roommate_id

    if description:
        chore.description = description
    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str).replace(tzinfo=None)
            chore.start_date = start_date
        except Exception:
            return jsonify({"message": "Invalid start_date format"}), 400
    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str).replace(tzinfo=None)
            chore.end_date = end_date
        except Exception:
            return jsonify({"message": "Invalid end_date format"}), 400

    if is_task is not None:
        chore.is_task = is_task
    if recurrence:
        chore.recurrence = recurrence
    if completed is not None:
        chore.completed = completed

    db.session.commit()

    assigned_roommate_data = None
    if chore.assignee:  # chore.assignee is the relationship to Roommate
        assigned_roommate_data = {
            "id": chore.assignee.id,
            "first_name": chore.assignee.first_name,
            "last_name": chore.assignee.last_name,
        }

    chore_data = {
        "id": chore.id,
        "created_at": chore.created_at.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "updated_at": chore.updated_at.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "description": chore.description,
        "start_date": chore.start_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "end_date": chore.end_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "is_task": chore.is_task,
        "completed": chore.completed,
        "assigned_roommate": assigned_roommate_data,
        "roommate_assignor_id": chore.assignor_fkey,
        "room_id": current_roommate.room_fkey,
        "recurrence": chore.recurrence,
        "rotation_order": chore.rotation_order,
    }
    return jsonify({"chore": chore_data}), 200


# DELETE /chores/<int:chore_id>
# Deletes a chore.
@jwt_required()
def delete_chore(chore_id):
    chore = Chore.query.get(chore_id)
    if not chore:
        return jsonify({"message": "Chore not found"}), 404

    db.session.delete(chore)
    db.session.commit()
    return "", 204
