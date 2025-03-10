from datetime import datetime, timedelta, timezone

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from database import db
from models.chore import Chore
from models.roommate import Roommate


# Rotates the chore to the next roommate in the rotation if the end_date has passed
# NOTE: This relies on the caller to commit the changes to the database
def rotate_chore(chore):
    if (
        chore.recurrence != "none"
        and chore.end_date < datetime.now()
        and chore.rotation_order
    ):
        # Update the assignee_fkey to the next roommate in the rotation
        current_index = chore.rotation_order.index(chore.assignee_fkey)
        next_index = (current_index + 1) % len(chore.rotation_order)
        chore.assignee_fkey = chore.rotation_order[next_index]

        # Update the start and end dates depending on recurrence (timezone agnostic)
        if chore.recurrence == "daily":
            duration = timedelta(days=1)
            new_start_date = chore.start_date + duration
            new_end_date = new_start_date + duration
        elif chore.recurrence == "weekly":
            duration = timedelta(weeks=1)
            new_start_date = chore.start_date + duration
            new_end_date = new_start_date + duration
        elif chore.recurrence == "monthly":
            # Get the number of days in the previous month (using start_date)
            # Add a couple days to ensure we're in the right month regardless of timezone
            reference_date1 = chore.start_date + timedelta(days=2)
            first_day_of_month = reference_date1.replace(day=1)
            last_day_of_month = (first_day_of_month + timedelta(days=32)).replace(
                day=1
            ) - timedelta(days=1)
            duration1 = timedelta(days=last_day_of_month.day)
            new_start_date = chore.start_date + duration1

            # Get the number of days in the next month (using end_date)
            reference_date2 = chore.end_date + timedelta(days=2)
            first_day_of_month = reference_date2.replace(day=1)
            last_day_of_month = (first_day_of_month + timedelta(days=32)).replace(
                day=1
            ) - timedelta(days=1)
            duration2 = timedelta(days=last_day_of_month.day)
            new_end_date = chore.end_date + duration2

        chore.start_date = new_start_date
        chore.end_date = new_end_date

        # Reset completed to False if it's a task
        if chore.is_task:
            chore.completed = False


# GET /chores
# Returns all active chores in the current user's room.
@jwt_required()
def get_chores():
    current_roommate_id = int(get_jwt_identity())

    current_roommate = Roommate.query.get(current_roommate_id)
    if not current_roommate:
        return jsonify({"message": "User not found"}), 404

    if not current_roommate.room_fkey:
        return jsonify({"message": "User is not in a room"}), 400

    # Get all roommates in the same room
    roommates = Roommate.query.filter_by(room_fkey=current_roommate.room_fkey).all()
    roommate_ids = [rm.id for rm in roommates]

    # Get active chores in the same room (active meaning start_date <= now() <= end_date)
    now_utc = datetime.now()
    active_chores = Chore.query.filter(
        Chore.assignee_fkey.in_(roommate_ids),
        Chore.start_date <= now_utc,
        now_utc <= Chore.end_date,
    ).all()

    # Rotate chores that have ended
    for chore in active_chores:
        rotate_chore(chore)
    db.session.commit()  # Commit the changes to the database

    data = []
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
            "created_at": chore.created_at.replace(tzinfo=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "updated_at": chore.updated_at.replace(tzinfo=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "description": chore.description,
            "start_date": chore.start_date.replace(tzinfo=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "end_date": chore.end_date.replace(tzinfo=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "is_task": chore.is_task,
            "completed": chore.completed,
            "room_id": current_roommate.room_fkey,
            "assigned_roommate": assigned_roommate_data,
            "roommate_assignor_id": chore.assignor_fkey,
            "rotation_order": chore.rotation_order,
            "recurrence": chore.recurrence,
        }
        data.append(chore_data)

    return jsonify({"chores": data}), 200


# POST /chores
# Creates a new chore.
@jwt_required()
def create_chore():
    current_roommate_id = int(get_jwt_identity())

    current_roommate = Roommate.query.get(current_roommate_id)
    if not current_roommate:
        return jsonify({"message": "User not found"}), 404

    if not current_roommate.room_fkey:
        return jsonify({"message": "User is not in a room"}), 400

    data = request.get_json()

    description = data.get("description")
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    is_task = data.get("is_task")
    recurrence = data.get("recurrence")
    assigned_roommate_id = data.get("assigned_roommate_id")
    rotation_order = data.get("rotation_order")

    if not all(
        [
            description,
            start_date_str,
            end_date_str,
            is_task is not None,
            recurrence,
            assigned_roommate_id,
        ]
    ):
        return jsonify({"message": "Missing required fields"}), 400

    assigned_roommate = Roommate.query.get(assigned_roommate_id)
    if not assigned_roommate:
        return jsonify({"message": "Assigned roommate not found"}), 404

    if assigned_roommate.room_fkey != current_roommate.room_fkey:
        return jsonify({"message": "Assigned roommate is not in the same room"}), 400

    if recurrence != "none" and rotation_order is not None:
        for roommate_id in rotation_order:
            roommate = Roommate.query.get(roommate_id)
            if not roommate:
                return (
                    jsonify({"message": "Rotation order contains invalid roommate id"}),
                    400,
                )
            if roommate.room_fkey != current_roommate.room_fkey:
                return (
                    jsonify(
                        {
                            "message": "Rotation order contains roommate not in the same room"
                        }
                    ),
                    400,
                )

    # Parse start and end date strings
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
        rotation_order=rotation_order,
    )

    db.session.add(new_chore)
    db.session.commit()

    assigned_roommate_data = None
    if new_chore.assignee:
        assigned_roommate_data = {
            "id": new_chore.assignee.id,
            "first_name": new_chore.assignee.first_name,
            "last_name": new_chore.assignee.last_name,
        }

    chore_data = {
        "id": new_chore.id,
        "created_at": new_chore.created_at.replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "updated_at": new_chore.updated_at.replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "description": new_chore.description,
        "start_date": new_chore.start_date.replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "end_date": new_chore.end_date.replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
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
    current_roommate_id = int(get_jwt_identity())

    current_roommate = Roommate.query.get(current_roommate_id)
    if not current_roommate:
        return jsonify({"message": "User not found"}), 404

    if not current_roommate.room_fkey:
        return jsonify({"message": "User is not in a room"}), 400

    chore = Chore.query.get(chore_id)
    if not chore:
        return jsonify({"message": "Chore not found"}), 404

    current_assigned_roommate = Roommate.query.get(chore.assignee_fkey)
    if current_assigned_roommate.room_fkey != current_roommate.room_fkey:
        return jsonify({"message": "This chore does not belong to the same room"}), 400

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
    if recurrence != "none" and rotation_order is not None:
        for roommate_id in rotation_order:
            roommate = Roommate.query.get(roommate_id)
            if not roommate:
                return (
                    jsonify({"message": "Rotation order contains invalid roommate id"}),
                    400,
                )
            if roommate.room_fkey != current_roommate.room_fkey:
                return (
                    jsonify(
                        {
                            "message": "Rotation order contains roommate not in the same room"
                        }
                    ),
                    400,
                )

        chore.rotation_order = rotation_order
        # If rotation_order is not empty, set assignee_fkey to the first person in the list
        if rotation_order:
            chore.assignee_fkey = rotation_order[0]
    # If this is not a recurring chore (no rotation_order) and assigned_roommate_id is provided
    elif assigned_roommate_id is not None:
        roommate = Roommate.query.get(assigned_roommate_id)
        if not roommate:
            return jsonify({"message": "Assigned roommate not found"}), 404
        if roommate.room_fkey != current_roommate.room_fkey:
            return (
                jsonify({"message": "Assigned roommate is not in the same room"}),
                400,
            )
        chore.assignee_fkey = assigned_roommate_id

    if description:
        chore.description = description
    if start_date_str:
        try:
            chore.start_date = datetime.fromisoformat(start_date_str).replace(
                tzinfo=None
            )
        except Exception:
            return jsonify({"message": "Invalid start_date format"}), 400
    if end_date_str:
        try:
            chore.end_date = datetime.fromisoformat(end_date_str).replace(tzinfo=None)
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
    if chore.assignee:
        assigned_roommate_data = {
            "id": chore.assignee.id,
            "first_name": chore.assignee.first_name,
            "last_name": chore.assignee.last_name,
        }

    chore_data = {
        "id": chore.id,
        "created_at": chore.created_at.replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "updated_at": chore.updated_at.replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "description": chore.description,
        "start_date": chore.start_date.replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "end_date": chore.end_date.replace(tzinfo=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
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
    current_roommate_id = int(get_jwt_identity())

    current_roommate = Roommate.query.get(current_roommate_id)
    if not current_roommate:
        return jsonify({"message": "User not found"}), 404

    if not current_roommate.room_fkey:
        return jsonify({"message": "User is not in a room"}), 400

    chore = Chore.query.get(chore_id)
    if not chore:
        return jsonify({"message": "Chore not found"}), 404

    assigned_roommate = Roommate.query.get(chore.assignee_fkey)
    if assigned_roommate.room_fkey != current_roommate.room_fkey:
        return jsonify({"message": "This chore does not belong to the same room"}), 400

    db.session.delete(chore)
    db.session.commit()

    return {}, 204
