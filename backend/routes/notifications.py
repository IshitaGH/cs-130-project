from datetime import datetime

from flask import jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from database import db
from models.notifications import Notification
from models.roommate import Room, Roommate


@jwt_required()
def create_notification():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404

    data = request.get_json()
    
    if "notification_sender" in data:
        notification_sender_id = Room.query.get(data.get("notification_sender"))
        if not notification_sender_id:
            return jsonify({"message": "Roommate sender id not found"}), 404
    else:
        notification_sender_id=roommate_id

    notification_recipient_id = Room.query.get(data.get("notification_recipient"))
    if not notification_recipient_id:
        return jsonify({"message": "Roommate recipient id not found"}), 404
    
    if notification_sender_id == notification_recipient_id:
        return jsonify({"message": "notification sender and recipient cannot be the same"}), 400
    
    new_notification = Notification(
        title=data.get("title"),
        description=data.get("description"),
        notification_time=datetime.utcnow(),
        notification_sender=notification_sender_id,
        notification_recipient=notification_recipient_id,
        room_fkey=room.id
    )

    db.session.add(new_notification)
    db.session.commit()
    
    return (
        jsonify(
            {
                "id": new_notification.id,
                "title": new_notification.title,
                "description": new_notification.description,
                "notification_time": new_notification.notification_time.isoformat(),
                "notification_sender": new_notification.notification_sender,
                "new_notification_recipient": new_notification.notification_recipient,
                "room_fkey": new_notification.room_fkey
            }
        ),
        201,
    )

@jwt_required()
def get_notification():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get(roommate_id)
    if not roommate or not roommate.room_fkey:
        return jsonify({"room_id": None}), 404
    room = Room.query.get(roommate.room_fkey)
    if not room:
        return jsonify({"message": "Room not found"}), 404
    
    data = request.get_json(silent=True)
    
    if not data is None and "notification_id" in data:
        notification = Notification.query.get(data["notification_id"])
        
        return (
            jsonify(
                {
                    "id": notification.id,
                    "title": notification.title,
                    "description": notification.description,
                    "notification_time": notification.notification_time.isoformat(),
                    "notification_sender": notification.notification_sender,
                    "new_notification_recipient": notification.notification_recipient,
                    "room_fkey": notification.room_fkey
                }
            ),
            201,
        )

    elif not data is None:
        if "notification_recipient" in data and "notification_sender" in data:
            notifications = Notification.query.filter_by(notification_recipient=data["notification_recipient"], notification_sender=data["notification_sender"]).all()
        elif "notification_sender" in data:
            notifications = Notification.query.filter_by(notification_sender=data["notification_sender"]).all()
        elif "notification_recipient" in data:
            notifications = Notification.query.filter_by(notification_recipient=data["notification_recipient"]).all()
    else:
        notifications = Notification.query.filter_by(room_fkey=room.id)
            
    result=[]
    for n in notifications:
        result.append(
            {
                "id": n.id,
                "title": n.title,
                "description": n.description,
                "notification_time": n.notification_time.isoformat(),
                "notification_sender": n.notification_sender,
                "new_notification_recipient": n.notification_recipient,
                "room_fkey": n.room_fkey
            }
        )
    return jsonify(result), 200