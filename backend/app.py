import base64
import os
import logging

from flask import Flask, jsonify, request
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token

from database import db, migrate
from models.chore import Chore
from models.expense import Expense, Roommate_Expense
from models.roommate import Room, Roommate
from routes.chore import create_chore, delete_chore, get_chores, update_chore
from routes.expense import create_expense, get_expense, remove_expense, update_expense
from routes.expense_period import (
    close_expense_period,
    create_expense_period,
    delete_expense_period,
    get_expense_period,
)
from routes.notifications import (
    create_notification,
    delete_notification,
    get_notification,
    update_notification,
)
from routes.room import create_room, get_current_room, join_room, leave_room
from routes.roommate import (
    get_profile_picture,
    get_roommates_in_room,
    update_profile_picture,
)
from routes.roommate_expense import get_roommate_expense
from logs.logging_config import setup_logging, log_request_info, log_response_info

app = Flask(__name__)
# The following environment variables are set in docker-compose.yml
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY"
)  # Change this to a strong secret key. Used to sign all JWT's
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


jwt = JWTManager(app)  # Must take app as a parameter to use secret key
bcrypt = Bcrypt(app)
CORS(app)  # Allow all origins for development -> will need to change for production

db.init_app(app)
migrate.init_app(app, db)

# Set up logging
logger = setup_logging()


# Log request details and set user info
@app.before_request
def before_request():
    log_request_info(logger)


# Log response details
@app.after_request
def after_request(response):
    return log_response_info(response, logger)


# AUTHENTICATION ROUTES
@app.route("/register", methods=["POST"])
def register():
    logger.info("Register endpoint called")
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    username = data.get("username")
    password = data.get("password")
    file = data.get("profile_picture")

    if not (first_name and last_name and username and password):
        return jsonify({"message": "All fields are required"}), 400

    if len(username) < 3 or len(password) < 3:
        return (
            jsonify(
                {"message": "Username and password must be at least 3 characters long"}
            ),
            400,
        )

    if Roommate.query.filter_by(username=username).first():
        logger.warning(f"Attempt to register with existing username: {username}")
        return jsonify({"message": "Username already exists"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")

    if file:
        try:
            profile_picture = base64.b64decode(file)
        except (base64.binascii.Error, TypeError):
            return jsonify({"message": "Invalid base64-encoded profile picture"}), 400
    else:
        profile_picture = None

    new_roommate = Roommate(
        first_name=first_name,
        last_name=last_name,
        username=username,
        password_hash=hashed_pw,
        profile_picture=profile_picture,
    )
    db.session.add(new_roommate)
    db.session.commit()
    logger.info(f"New user registered: {username}")
    return {}, 204


@app.route("/login", methods=["POST"])
def login():
    logger.info("Login endpoint called")
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    roommate = Roommate.query.filter_by(username=username).first()
    if not roommate or not bcrypt.check_password_hash(roommate.password_hash, password):
        logger.warning(f"Failed login attempt for username: {username}")
        return jsonify({"message": "Invalid username or password"}), 401
    logger.info(f"User logged in: {username} (ID: {roommate.id})")

    access_token = create_access_token(identity=str(roommate.id))
    return jsonify({"access_token": access_token}), 200


# ROOM ROUTES
@app.route("/room", methods=["GET"])
def get_current_room_route():
    logger.info("Get current room endpoint called")
    return get_current_room()


@app.route("/rooms", methods=["POST"])
def create_room_route():
    logger.info("Create room endpoint called")
    return create_room()


@app.route("/rooms/join", methods=["POST"])
def join_room_route():
    logger.info("Join room endpoint called")
    return join_room()


@app.route("/rooms/leave", methods=["POST"])
def leave_room_route():
    logger.info("Leave room endpoint called")
    return leave_room()


# ROOMMATES ROUTES
@app.route("/roommates", methods=["GET"])
def get_roommates_route():
    logger.info("Get roommates endpoint called")
    return get_roommates_in_room()

@app.route("/profile_picture", methods=["GET"])
def get_profile_picture_route():
    logger.info("Get profile picture endpoint called")
    return get_profile_picture()

@app.route("/profile_picture", methods=["PUT"])
def update_profile_picture_route():
    logger.info("Update profile picture endpoint called")
    return update_profile_picture()


# EXPENSE ROUTES
@app.route("/expense", methods=["POST"])
def create_expense_route():
    logger.info("Create expense endpoint called")
    return create_expense()


@app.route("/expense", methods=["GET"])
def get_expense_route():
    logger.info("Get expense endpoint called")
    return get_expense()


@app.route("/expense", methods=["PUT"])
def update_expense_route():
    logger.info("Update expense endpoint called")
    return update_expense()


@app.route("/expense", methods=["DELETE"])
def remove_exense_route():
    logger.info("Remove expense endpoint called")
    return remove_expense()


@app.route("/expense_period", methods=["POST"])
def create_expense_period_route():
    logger.info("Create expense period endpoint called")
    return create_expense_period()


@app.route("/expense_period", methods=["GET"])
def get_expense_period_route():
    logger.info("Get expense period endpoint called")
    return get_expense_period()


@app.route("/expense_period", methods=["PUT"])
def close_expense_period_route():
    logger.info("Close expense period endpoint called")
    return close_expense_period()


@app.route("/expense_period", methods=["DELETE"])
def delete_expense_period_route():
    logger.info("Delete expense period endpoint called")
    return delete_expense_period()


@app.route("/roommate_expense", methods=["GET"])
def get_roommate_expense_route():
    logger.info(f"Get roommate expense endpoint called by user: {g.user_id}")
    return get_roommate_expense()


# CHORES ROUTES
@app.route("/chores", methods=["POST"])
def create_chore_route():
    logger.info("Create chore endpoint called")
    return create_chore()


@app.route("/chores", methods=["GET"])
def get_chore_route():
    logger.info("Get chores endpoint called")
    return get_chores()


@app.route("/chores/<int:chore_id>", methods=["PUT"])
def update_chore_route(chore_id):
    logger.info(f"Update chore endpoint called for chore_id: {chore_id}")
    logger.info(f"Chore updated: {chore_id}")
    return update_chore(chore_id)


@app.route("/chores/<int:chore_id>", methods=["DELETE"])
def delete_chore_route(chore_id):
    logger.info(f"Delete chore endpoint called for chore_id: {chore_id}")
    logger.info(f"Chore deleted: {chore_id}")
    return delete_chore(chore_id)


# NOTIFICATION ROUTES
@app.route("/notifications", methods=["POST"])
def create_notification_route():
    logger.info("Create notification endpoint called")
    return create_notification()


@app.route("/notifications", methods=["GET"])
def get_notification_route():
    logger.info("Get notification endpoint called")
    return get_notification()


@app.route("/notifications", methods=["PUT"])
def update_notification_route():
    logger.info("Update notification endpoint called")
    return update_notification()


@app.route("/notifications", methods=["DELETE"])
def delete_notification_route():
    logger.info("Delete notification endpoint called")
    return delete_notification()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
