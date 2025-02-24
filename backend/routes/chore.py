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


@jwt_required()
def create_chore():
    assignor_id = get_jwt_identity()

    data = request.json

    start_date = data.get("start_date", datetime.utcnow())
    duration = data.get("duration", "1 days")  # expects input in the format "_ days"
    title = data.get("title")
    autorotate = data.get("autorotate", False)
    is_task = data.get("is_task", False)
    description = data.get("description")
    assignee = data.get("assignee")

    if not title:
        return jsonify({"error": "Chore title is required"}), 400

    if not assignee:
        return jsonify({"error": "Assignee is required"}), 400

    new_chore = Chore(
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        start_date=start_date,
        duration=duration,
        title=title,
        autorotate=autorotate,
        is_task=is_task,
        description=description,
        assignee_fkey=assignee,
        assignor_fkey=assignor_id,
    )

    db.session.add(new_chore)
    db.session.commit()

    return (
        jsonify(
            {
                "id": new_chore.id,
                "created_at": new_chore.created_at.isoformat(),
                "updated_at": new_chore.updated_at.isoformat(),
                "start_date": new_chore.start_date.isoformat(),
                "duration": new_chore.duration.total_seconds(),
                "title": new_chore.title,
                "autorotate": new_chore.autorotate,
                "is_task": new_chore.is_task,
                "completed": new_chore.completed,
                "description": new_chore.description,
                "assignee": new_chore.assignee_fkey,
                "assignor": new_chore.assignor_fkey,
            }
        ),
        201,
    )
