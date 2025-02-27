import json
import unittest
from datetime import datetime, timedelta, timezone

from app import app, db 

class ChoreEndpointsTestCase(unittest.TestCase):
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

    def test_get_chores_empty(self):
        response = self.client.get("/chores", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("chores", data)
        self.assertEqual(len(data["chores"]), 0)

    def test_create_chore(self):
        end_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        chore_payload = {
            "description": "Clean kitchen",
            "end_date": end_date,
            "autorotate": False,
            "is_task": True,
            "recurrence": "daily"
        }
        response = self.client.post("/chores", json=chore_payload, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn("chore", data)
        chore = data["chore"]
        self.assertEqual(chore["description"], "Clean kitchen")
        self.assertFalse(chore["completed"])

    def test_update_chore(self):
        end_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        chore_payload = {
            "description": "Wash dishes",
            "end_date": end_date,
            "autorotate": False,
            "is_task": True,
            "recurrence": "daily"
        }
        create_response = self.client.post("/chores", json=chore_payload, headers=self.headers)
        self.assertEqual(create_response.status_code, 201)
        chore_id = json.loads(create_response.data)["chore"]["id"]

        update_payload = {
            "description": "Wash dishes thoroughly",
            "completed": True
        }
        update_response = self.client.put(f"/chores/{chore_id}", json=update_payload, headers=self.headers)
        self.assertEqual(update_response.status_code, 200)
        updated_chore = json.loads(update_response.data)["chore"]
        self.assertEqual(updated_chore["description"], "Wash dishes thoroughly")
        self.assertTrue(updated_chore["completed"])

    def test_delete_chore(self):
        end_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        chore_payload = {
            "description": "Take out trash",
            "end_date": end_date,
            "autorotate": False,
            "is_task": True,
            "recurrence": "weekly"
        }
        create_response = self.client.post("/chores", json=chore_payload, headers=self.headers)
        self.assertEqual(create_response.status_code, 201)
        chore_id = json.loads(create_response.data)["chore"]["id"]

        delete_response = self.client.delete(f"/chores/{chore_id}", headers=self.headers)
        self.assertEqual(delete_response.status_code, 204)

        get_response = self.client.get("/chores", headers=self.headers)
        chores = json.loads(get_response.data)["chores"]
        self.assertNotIn(chore_id, [c["id"] for c in chores])

if __name__ == "__main__":
    unittest.main()
