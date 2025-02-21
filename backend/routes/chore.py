from datetime import datetime

from flask import jsonify, request

from database import db
from models.chore import Chore

def create_chore():
    data = request.get_json()

    new_chore = Chore(
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        start_date=data.get("start_date","").strip(),
        duration=data.get("duration","").strip(),
        title=data.get("title","").strip(),
        autorotate=data.get("autorotate",""),
        is_task=data.get("is_task",""),
        completed=data.get("completed",""),
        description=data.get("description","").strip(),
        assignee_fkey=data.get("assignee_fkey",""),
        assignor_fkey=data.get("assignor_fkey",""),
    )

    db.session.add(new_chore)
    db.session.commit()

    return (
        jsonify(
            {
                "id": new_chore.id,
                "start_date": data.get("start_date","").strip(),
                "duration": data.get("duration","").strip(),
                "title": data.get("title","").strip(),
                "autorotate": data.get("autorotate",""),
                "is_task": data.get("is_task",""),
                "completed": data.get("completed",""),
                "description": data.get("description","").strip(),
                "assignee_fkey": data.get("assignee_fkey",""),
                "assignor_fkey": data.get("assignor_fkey",""),

                "created_at": new_chore.created_at.isoformat(),
                "updated_at": new_chore.updated_at.isoformat(),
            }
        ),
        201,
    )