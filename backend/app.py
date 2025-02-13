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
from routes.room import create_room, get_room
from routes.roommate import create_roommate

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

users = {}  # temporary database, resets everytime server restarts so not persistent


# Register
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if username in users:
        return jsonify({"message": "User already exists"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    users[username] = hashed_pw
    return jsonify({"message": "User registered successfully"}), 201


# Login
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if username not in users or not bcrypt.check_password_hash(
        users[username], password
    ):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=username)
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


app.route("/room", methods=["POST"])(create_room)
app.route("/room/<int:room_id>", methods=["GET"])(get_room)

app.route("/roommate", methods=["POST"])(create_roommate)
