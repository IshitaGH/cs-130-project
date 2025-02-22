import os

from dotenv import load_dotenv
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
from routes.room import create_room, get_current_room, join_room, leave_room
from routes.roommate import create_roommate
from routes.expense import create_expense, get_expense, update_expense, remove_expense
from routes.expense_period import create_expense_period, get_expense_period

load_dotenv()


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY"
)  # Change this to a strong secret key. Used to sign all JWT's
jwt = JWTManager(app)  # Must take app as a parameter to use secret key
bcrypt = Bcrypt(app)
CORS(app)  # Allow all origins for development -> will need to change for production


db.init_app(app)
migrate.init_app(app, db)


# Register
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    first_name = data.get("firstName")
    last_name = data.get("lastName")
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


# Login
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    roommate = Roommate.query.filter_by(username=username).first()
    if not roommate or not bcrypt.check_password_hash(roommate.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(roommate.id))
    return jsonify({"access_token": access_token}), 200


# Protected Route (Requires Authentication)
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()  # gets the username of the current user
    return (
        jsonify({"message": f"Hello, {current_user}! Welcome to the protected page."}),
        200,
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)


@app.get("/")
def home():
    return "Need to figure out what we want here"


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

@app.route("/rooms/expense", methods=["POST"])
def create_expense_route():
    return create_expense()

@app.route("/rooms/expense", methods=["GET"])
def get_expense_route():
    return get_expense()

@app.route("/rooms/expense", methods=["PUT"])
def update_expense_route():
    return update_expense()

@app.route("/rooms/expense", methods=["DELETE"])
def remove_exense_route():
    return remove_expense()

@app.route("/rooms/expense_period", methods=["POST"])
def create_expense_period_route():
    return create_expense_period()

@app.route("/rooms/expense_period", methods=["GET"])
def get_expense_period_route():
    return get_expense_period()