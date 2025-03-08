from datetime import datetime

from database import db
from flask import jsonify, request
from flask_jwt_extended import (JWTManager, create_access_token,
                                get_jwt_identity, jwt_required)
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
        notification_sender = Roommate.query.get(data.get("notification_sender"))
        if not notification_sender:
            return jsonify({"message": "Roommate sender id not found"}), 404
    else:
        notification_sender = roommate

    notification_recipient = Roommate.query.get(data.get("notification_recipient"))
    if not notification_recipient:
        return jsonify({"message": "Roommate recipient id not found"}), 404

    new_notification = Notification(
        title=data.get("title"),
        description=data.get("description"),
        notification_time=datetime.utcnow(),
        notification_sender=notification_sender.id,
        notification_recipient=notification_recipient.id,
        room_fkey=room.id,
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
                "notification_recipient": new_notification.notification_recipient,
                "room_fkey": new_notification.room_fkey,
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

        if not notification:
            return jsonify({"message": "Notification not found"}), 404

        return (
            jsonify(
                {
                    "id": notification.id,
                    "title": notification.title,
                    "description": notification.description,
                    "notification_time": notification.notification_time.isoformat(),
                    "notification_sender": notification.notification_sender,
                    "notification_recipient": notification.notification_recipient,
                    "room_fkey": notification.room_fkey,
                }
            ),
            200,
        )

    elif not data is None:
        if "notification_recipient" in data and "notification_sender" in data:
            notifications = Notification.query.filter_by(
                notification_recipient=data["notification_recipient"],
                notification_sender=data["notification_sender"],
            ).all()
        elif "notification_sender" in data:
            notifications = Notification.query.filter_by(
                notification_sender=data["notification_sender"]
            ).all()
        elif "notification_recipient" in data:
            notifications = Notification.query.filter_by(
                notification_recipient=data["notification_recipient"]
            ).all()
    else:
        notifications = Notification.query.filter_by(room_fkey=room.id)

    result = []
    for n in notifications:
        result.append(
            {
                "id": n.id,
                "title": n.title,
                "description": n.description,
                "notification_time": n.notification_time.isoformat(),
                "notification_sender": n.notification_sender,
                "notification_recipient": n.notification_recipient,
                "room_fkey": n.room_fkey,
            }
        )
    return jsonify(result), 200


@jwt_required()
def update_notification():
    data = request.get_json()

    notification = Notification.query.get(data["notification_id"])

    if "notification_sender" in data:
        notification_sender = Roommate.query.get(data.get("notification_sender"))
        if not notification_sender:
            return jsonify({"message": "Roommate sender id not found"}), 404

    if "notification_sender" in data:
        notification_recipient = Roommate.query.get(data.get("notification_recipient"))
        if not notification_recipient:
            return jsonify({"message": "Roommate recipient id not found"}), 404

    if notification:
        notification.title = (
            data.get("title") if "title" in data else notification.title,
        )
        notification.description = (
            (
                data.get("description")
                if "description" in data
                else notification.description
            ),
        )
        notification.notification_time = (datetime.utcnow(),)
        notification.notification_sender = (
            (
                data.get("notification_sender")
                if "notification_sender" in data
                else notification.notification_sender
            ),
        )
        notification.notification_recipient = (
            data.get("notification_recipient")
            if "notification_recipient" in data
            else notification.notification_recipient
        )

    db.session.commit()

    return (
        jsonify(
            {
                "id": notification.id,
                "title": notification.title,
                "description": notification.description,
                "notification_time": notification.notification_time.isoformat(),
                "notification_sender": notification.notification_sender,
                "notification_recipient": notification.notification_recipient,
                "room_fkey": notification.room_fkey,
            }
        ),
        200,
    )


@jwt_required()
def delete_notification():
    data = request.get_json()
    notification = Notification.query.get(data["notification_id"])

    if notification:
        db.session.delete(notification)
        db.session.commit()
        return jsonify({"message": "Notification deleted successfully"}), 204
    else:
        return jsonify({"message": "Notification not found"}), 404
