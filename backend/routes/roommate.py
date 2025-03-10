import base64
from io import BytesIO

from flask import jsonify, request, send_file
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from database import db
from models.roommate import Roommate


@jwt_required()
def get_profile_picture():
    user_id = request.args.get("user_id")
    if user_id:
        roommate = Roommate.query.get_or_404(user_id)
    else:
        roommate_id = get_jwt_identity()
        roommate = Roommate.query.get_or_404(roommate_id)

    if not roommate.profile_picture:
        return jsonify({"message": "No profile picture found"}), 404

    return send_file(
        BytesIO(roommate.profile_picture),
        mimetype="image/jpeg",
        as_attachment=False,
    )


@jwt_required()
def update_profile_picture():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get_or_404(roommate_id)

    data = request.get_json()
    file = data.get("profile_picture")

    if file:
        try:
            profile_picture = base64.b64decode(file)
        except (base64.binascii.Error, TypeError):
            return jsonify({"message": "Invalid base64-encoded profile picture"}), 400
    else:
        profile_picture = None

    roommate.profile_picture = profile_picture
    db.session.commit()
    return jsonify({"message": "Profile picture updated successfully"}), 200


@jwt_required()
def get_roommates_in_room():
    roommate_id = int(get_jwt_identity())

    current_roommate = Roommate.query.get(roommate_id)
    if not current_roommate:
        return jsonify({"message": "User not found"}), 404

    if not current_roommate.room_fkey:
        return jsonify({"message": "User is not assigned to any room"}), 404

    roommates = Roommate.query.filter_by(room_fkey=current_roommate.room_fkey).all()

    data = []
    for rm in roommates:
        data.append(
            {
                "id": rm.id,
                "first_name": rm.first_name,
                "last_name": rm.last_name,
                "username": rm.username,
                "created_at": rm.created_at.isoformat(),
                "updated_at": rm.updated_at.isoformat(),
            }
        )
    return jsonify({"roommates": data}), 200


@jwt_required()
def update_user_info():
    roommate_id = get_jwt_identity()
    roommate = Roommate.query.get_or_404(roommate_id)

    data = request.get_json()

    if "first_name" in data:
        roommate.first_name = data["first_name"]

    if "last_name" in data:
        roommate.last_name = data["last_name"]

    db.session.commit()

    return (
        jsonify(
            {
                "message": "User information updated successfully",
                "user": {
                    "id": roommate.id,
                    "first_name": roommate.first_name,
                    "last_name": roommate.last_name,
                    "username": roommate.username,
                    "created_at": roommate.created_at.isoformat(),
                    "updated_at": roommate.updated_at.isoformat(),
                },
            }
        ),
        200,
    )
