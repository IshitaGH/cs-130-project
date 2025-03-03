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
