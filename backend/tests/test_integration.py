import json
import unittest
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import decode_token

from app import app, db 
from models.chore import Chore, Roommate

class IntegrationTestCase(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        app.config["JWT_SECRET_KEY"] = "test-secret-key"
        self.client = app.test_client()

        with app.app_context():
            db.create_all()

        self.register_user("Test", "User", "testuser", "password")
        self.token = self.login_user("testuser", "password")
        self.headers = {"Authorization": f"Bearer {self.token}"}

        room_response = self.client.post(
            "/rooms",
            json={"room_name": "Test Room"},
            headers=self.headers
        )
        self.assertEqual(room_response.status_code, 201)

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def register_user(self, first_name, last_name, username, password):
        return self.client.post(
            "/register",
            json={
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
                "password": password
            }
        )

    def login_user(self, username, password):
        response = self.client.post(
            "/login",
            json={"username": username, "password": password}
        )
        data = json.loads(response.data)
        return data.get("access_token")

    def test_create_chore_integration(self):
        # Calculate an end_date for the chore
        end_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()

        chore_payload = {
            "description": "Clean the living room",
            "end_date": end_date,
            "autorotate": False,
            "is_task": True,
            "recurrence": "daily"
        }
        response = self.client.post("/chores", json=chore_payload, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        chore_id = data["chore"]["id"]

        # Now, verify via a direct DB query that the chore was created
        with app.app_context():
            chore = db.session.get(Chore, chore_id)
            self.assertIsNotNone(chore)
            self.assertEqual(chore.description, "Clean the living room")
            # Check that the chore is assigned to the current user (assignor and assignee)
            self.assertEqual(chore.assignor_fkey, int(self.get_user_id()))
            self.assertEqual(chore.assignee_fkey, int(self.get_user_id()))

    def get_user_id(self):
        # Helper: retrieve the current user's id based on the JWT identity
        decoded = decode_token(self.token)
        return int(decoded["sub"])
        
    def test_update_chore_integration(self):
        end_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        chore_payload = {
            "description": "Vacuum the hallway",
            "end_date": end_date,
            "autorotate": False,
            "is_task": True,
            "recurrence": "weekly"
        }
        create_response = self.client.post("/chores", json=chore_payload, headers=self.headers)
        self.assertEqual(create_response.status_code, 201)
        chore_id = json.loads(create_response.data)["chore"]["id"]

        # Update the chore via the API
        update_payload = {
            "description": "Deep clean the hallway",
            "completed": True
        }
        update_response = self.client.put(f"/chores/{chore_id}", json=update_payload, headers=self.headers)
        self.assertEqual(update_response.status_code, 200)

        # Verify that the changes are saved in the database
        with app.app_context():
            updated_chore = db.session.get(Chore, chore_id)
            self.assertEqual(updated_chore.description, "Deep clean the hallway")
            self.assertTrue(updated_chore.completed)

    def test_delete_chore_integration(self):
        end_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        chore_payload = {
            "description": "Take out recycling",
            "end_date": end_date,
            "autorotate": False,
            "is_task": True,
            "recurrence": "monthly"
        }
        create_response = self.client.post("/chores", json=chore_payload, headers=self.headers)
        self.assertEqual(create_response.status_code, 201)
        chore_id = json.loads(create_response.data)["chore"]["id"]

        # Delete the chore
        delete_response = self.client.delete(f"/chores/{chore_id}", headers=self.headers)
        self.assertEqual(delete_response.status_code, 204)

        # Verify the chore is removed from the database
        with app.app_context():
            deleted_chore = db.session.get(Chore, chore_id)
            self.assertIsNone(deleted_chore)

if __name__ == "__main__":
    unittest.main()
