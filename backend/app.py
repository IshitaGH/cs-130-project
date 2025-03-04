import os

from flask import Flask, jsonify, request
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

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

from routes.room import create_room, get_current_room, join_room, leave_room
from routes.chore import create_chore, get_chores, update_chore, delete_chore
from routes.roommate import get_roommates_in_room
from routes.roommate_expense import get_roommate_expense

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


# AUTHENTICATION ROUTES
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    username = data.get("username")
    password = data.get("password")

    if not (first_name and last_name and username and password):
        return jsonify({"message": "All fields are required"}), 400

    if Roommate.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    new_roommate = Roommate(
        first_name=first_name,
        last_name=last_name,
        username=username,
        password_hash=hashed_pw,
    )
    db.session.add(new_roommate)
    db.session.commit()
    return "", 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    roommate = Roommate.query.filter_by(username=username).first()
    if not roommate or not bcrypt.check_password_hash(roommate.password_hash, password):
        return jsonify({"message": "Invalid username or password"}), 401

    access_token = create_access_token(identity=str(roommate.id))
    return jsonify({"access_token": access_token}), 200


# ROOM ROUTES
@app.route("/room", methods=["GET"])
def get_current_room_route():
    return get_current_room()


@app.route("/rooms", methods=["POST"])
def create_room_route():
    return create_room()


@app.route("/rooms/join", methods=["POST"])
def join_room_route():
    return join_room()


@app.route("/rooms/leave", methods=["POST"])
def leave_room_route():
    return leave_room()

@app.route("/roommates", methods=["GET"])
def get_roommates_route():
    return get_roommates_in_room()


# ROOMMATES ROUTES
@app.route("/roommates", methods=["GET"])
def get_roommates_route():
    return get_roommates_in_room()


# EXPENSE ROUTES
@app.route("/expense", methods=["POST"])
def create_expense_route():
    return create_expense()


@app.route("/expense", methods=["GET"])
def get_expense_route():
    return get_expense()


@app.route("/expense", methods=["PUT"])
def update_expense_route():
    return update_expense()


@app.route("/expense", methods=["DELETE"])
def remove_exense_route():
    return remove_expense()


@app.route("/expense_period", methods=["POST"])
def create_expense_period_route():
    return create_expense_period()


@app.route("/expense_period", methods=["GET"])
def get_expense_period_route():
    return get_expense_period()


@app.route("/expense_period", methods=["PUT"])
def close_expense_period_route():
    return close_expense_period()


@app.route("/expense_period", methods=["DELETE"])
def delete_expense_period_route():
    return delete_expense_period()


@app.route("/roommate_expense", methods=["GET"])
def get_roommate_expense_route():
    return get_roommate_expense()


# CHORES ROUTES
@app.route("/chores", methods=["POST"])
def create_chore_route():
    return create_chore()


@app.route("/chores", methods=["GET"])
def get_chore_route():
    return get_chores()


@app.route("/chores/<int:chore_id>", methods=["PUT"])
def update_chore_route(chore_id):
    return update_chore(chore_id)


@app.route("/chores/<int:chore_id>", methods=["DELETE"])
def delete_chore_route(chore_id):
    return delete_chore(chore_id)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
