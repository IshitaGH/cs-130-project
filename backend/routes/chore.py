from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from database import db
from models.chore import Chore
from models.chore import Roommate
from datetime import datetime, timedelta, timezone
from sqlalchemy import func

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
    active_window_chores = Chore.query.filter(
        Chore.assignee_fkey.in_(roommate_ids),
        Chore.start_date <= func.now(),
        func.now() <= Chore.end_date
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
            "created_at": chore.created_at.isoformat(),
            "updated_at": chore.updated_at.isoformat(),
            "description": chore.description,
            "start_date": chore.start_date.isoformat(),
            "end_date": chore.end_date.isoformat(),
            "autorotate": chore.autorotate,
            "is_task": chore.is_task,
            "completed": chore.completed,
            "room_id": current_roommate.room_fkey,
            "assigned_roommate": assigned_roommate_data,
            "roommate_assignor_id": chore.assignor_fkey
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
    end_date_str = data.get("end_date")
    autorotate = data.get("autorotate")
    is_task = data.get("is_task")
    recurrence = data.get("recurrence")

    if not all([description, end_date_str, autorotate is not None, recurrence]):
        return jsonify({"message": "Missing required fields"}), 400

    # Set start_date to today's date at midnight (naive, in UTC)
    start_date = datetime.combine(datetime.utcnow().date(), datetime.min.time())

    # Parse end_date from the provided string
    try:
        end_date = datetime.fromisoformat(end_date_str)
    except Exception as e:
        return jsonify({"message": "Invalid end_date format"}), 400

    # Convert end_date to UTC naive if it is offset-aware
    if end_date.tzinfo is not None:
        end_date = end_date.astimezone(timezone.utc).replace(tzinfo=None)


    new_chore = Chore(
        description=description,
        start_date=start_date,
        end_date=end_date,
        autorotate=autorotate,
        is_task=is_task,
        completed=False,
        assignor_fkey=current_roommate_id,  # using the current user as assignor
        # TODO: Right now this is initially assigned self because we do not have a way to extract the roommate ID from the assigned roommate due to our free form text method
        assignee_fkey=current_roommate_id, 
        recurrence=recurrence
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
            "last_name": new_chore.assignee.last_name
        }

    chore_data = {
        "id": new_chore.id,
        "created_at": new_chore.created_at.isoformat(),
        "updated_at": new_chore.updated_at.isoformat(),
        "description": new_chore.description,
        "start_date": new_chore.start_date.isoformat(),
        "end_date": new_chore.end_date.isoformat(),
        "autorotate": new_chore.autorotate,
        "is_task": new_chore.is_task,
        "completed": new_chore.completed,
        "assigned_roommate": assigned_roommate_data,
        "roommate_assignor_id": new_chore.assignor_fkey,
        "room_id": current_roommate.room_fkey,
        "recurrence": new_chore.recurrence
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
    end_date_str = data.get("end_date")
    autorotate = data.get("autorotate")
    is_task = data.get("is_task")
    recurrence = data.get("recurrence")
    completed = data.get("completed")

    if description:
        chore.description = description
    if end_date_str:
        try:
            # Convert "Z" to "+00:00"
            new_end_date_str = end_date_str.replace("Z", "+00:00")

            new_end_date = datetime.fromisoformat(new_end_date_str)

            # Convert offset-aware to naive UTC if needed
            if new_end_date.tzinfo is not None:
                new_end_date = new_end_date.astimezone(timezone.utc).replace(tzinfo=None)

            chore.end_date = new_end_date
            chore.duration = new_end_date - chore.start_date
        except Exception as e:
            return jsonify({"message": "Invalid end_date format"}), 400

    if autorotate is not None:
        chore.autorotate = autorotate
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
            # add any other fields you need
        }

    chore_data = {
        "id": chore.id,
        "created_at": chore.created_at.isoformat(),
        "updated_at": chore.updated_at.isoformat(),
        "description": chore.description,
        "start_date": chore.start_date.isoformat(),
        "end_date": chore.end_date.isoformat(),
        "autorotate": chore.autorotate,
        "is_task": chore.is_task,
        "completed": chore.completed,
        "assigned_roommate": assigned_roommate_data,
        "roommate_assignor_id": chore.assignor_fkey,
        "room_id": current_roommate.room_fkey,
        "recurrence": chore.recurrence
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