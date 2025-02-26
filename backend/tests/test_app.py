import json
import os
import unittest

from flask_jwt_extended import create_access_token

from app import Room, Roommate, app, db


class FlaskAppTestCase(unittest.TestCase):
    def setUp(self):
        # Configure the app for testing.
        # if this does not work (the SQLALCHEMY_DATABSE_URI is not recognized), then
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"  # in-memory DB
        app.config["JWT_SECRET_KEY"] = "test-secret-key"
        self.app = app.test_client()

        # Create the database tables.
        with app.app_context():
            db.create_all()

    def tearDown(self):
        # Drop the database tables.
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def register_user(self, first_name, last_name, username, password):
        return self.app.post(
            "/register",
            json={
                "firstName": first_name,
                "lastName": last_name,
                "username": username,
                "password": password,
            },
        )

    def login_user(self, username, password):
        response = self.app.post(
            "/login", json={"username": username, "password": password}
        )
        data = json.loads(response.data)
        return data.get("access_token")

    def test_register_and_login(self):
        # Test user registration.
        response = self.register_user("John", "Doe", "johndoe", "password")
        self.assertEqual(response.status_code, 201)

        # Test login and token retrieval.
        token = self.login_user("johndoe", "password")
        self.assertIsNotNone(token)

    def test_create_room(self):
        # Register and login.
        self.register_user("John", "Doe", "johndoe", "password")
        token = self.login_user("johndoe", "password")
        headers = {"Authorization": f"Bearer {token}"}

        # Create a room.
        response = self.app.post(
            "/rooms", json={"room_name": "Test Room"}, headers=headers
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn("room_id", data)
        self.assertEqual(data["name"], "Test Room")

    def test_join_and_leave_room(self):
        # Register first user and create a room.
        self.register_user("John", "Doe", "johndoe", "password")
        token1 = self.login_user("johndoe", "password")
        headers1 = {"Authorization": f"Bearer {token1}"}
        room_response = self.app.post(
            "/rooms", json={"room_name": "Test Room"}, headers=headers1
        )
        self.assertEqual(room_response.status_code, 201)
        room_data = json.loads(room_response.data)
        invite_code = room_data["invite_code"]

        # Register second user and join the room.
        self.register_user("Jane", "Doe", "janedoe", "password")
        token2 = self.login_user("janedoe", "password")
        headers2 = {"Authorization": f"Bearer {token2}"}
        join_response = self.app.post(
            "/rooms/join", json={"invite_code": invite_code}, headers=headers2
        )
        self.assertEqual(join_response.status_code, 200)

        # Have the second user leave the room.
        leave_response = self.app.post("/rooms/leave", headers=headers2)
        self.assertEqual(leave_response.status_code, 200)

    def test_get_current_room(self):
        # Register, login, and create a room.
        self.register_user("John", "Doe", "johndoe", "password")
        token = self.login_user("johndoe", "password")
        headers = {"Authorization": f"Bearer {token}"}
        self.app.post("/rooms", json={"room_name": "Test Room"}, headers=headers)

        # Get the current room.
        response = self.app.get("/room", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["name"], "Test Room")


if __name__ == "__main__":
    unittest.main()
