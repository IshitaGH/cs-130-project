from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "super_secret_key"  # Change this to a strong secret key. Used to sign all JWT's
jwt = JWTManager(app) # Must take app as a parameter to use secret key
bcrypt = Bcrypt(app)
CORS(app) # Allow all origins for development -> will need to change for production

users = {} # temporary database, resets everytime server restarts so not persistent

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

    if username not in users or not bcrypt.check_password_hash(users[username], password):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=username)
    return jsonify({"access_token": access_token}), 200

# Protected Route (Requires Authentication)
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity() # gets the username of the current user
    return jsonify({"message": f"Hello, {current_user}! Welcome to the protected page."}), 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)