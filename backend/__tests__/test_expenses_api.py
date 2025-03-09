import json
import os
import unittest

from flask_jwt_extended import create_access_token

from app import app
from database import db
from models.expense import Expense, Expense_Period, Roommate_Expense

os.environ["DATABASE_URL"] = (
    "postgresql://myuser:securepassword@localhost:5432/test_database"
)


class ExpensesTestCase(unittest.TestCase):
    def setUp(self):
        # Configure the app for testing.
        # if this does not work (the SQLALCHEMY_DATABSE_URI is not recognized), then
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = (
            "postgresql://myuser:securepassword@localhost:5432/test_database"
        )
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
                "first_name": first_name,
                "last_name": last_name,
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

    def handle_roommate_set_up(self):
        self.register_user("John", "Doe", "johndoe", "password")
        token = self.login_user("johndoe", "password")
        headers = {"Authorization": f"Bearer {token}"}

        room_response = self.app.post(
            "/rooms", json={"room_name": "Test Room"}, headers=headers
        )
        self.assertEqual(room_response.status_code, 201)
        room_data = json.loads(room_response.data)
        invite_code = room_data["invite_code"]
        join_response = self.app.post(
            "/rooms/join", json={"invite_code": invite_code}, headers=headers
        )
        self.assertEqual(join_response.status_code, 200)

        return headers

    def test_no_room_create_expense(self):
        self.register_user("John", "Doe", "johndoe", "password")
        token = self.login_user("johndoe", "password")
        headers = {"Authorization": f"Bearer {token}"}

        response = self.app.post("/expense", json={"expenses": []}, headers=headers)
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertEqual(data["room_id"], None)

    def test_no_expense_period_create_expense(self):
        headers = self.handle_roommate_set_up()

        response = self.app.post("/expense", json={"expenses": []}, headers=headers)
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Open expense period not found")

    def test_normal_create_expense(self):
        headers = self.handle_roommate_set_up()
        self.app.post("/expense_period", json={}, headers=headers)
        response = self.app.post(
            "/expense",
            json={
                "title": "rent",
                "cost": "1000",
                "description": "unrealistically cheap rent",
            },
            headers=headers,
        )
        self.assertEqual(response.status_code, 201)

        data = json.loads(response.data)
        self.assertEqual(data["title"], "rent")
        self.assertEqual(data["cost"], 1000)
        self.assertEqual(data["description"], "unrealistically cheap rent")

        self.app.post("/expense_period", json={}, headers=headers)
        response = self.app.post(
            "/expense",
            json={
                "title": "vacuum",
                "cost": "500",
                "description": "need to clean",
                "roommate_spendor_id": 1,
            },
            headers=headers,
        )
        self.assertEqual(response.status_code, 201)

        data = json.loads(response.data)
        self.assertEqual(data["title"], "vacuum")
        self.assertEqual(data["cost"], 500)
        self.assertEqual(data["description"], "need to clean")

    def test_get_roommmate_expense(self):
        headers = self.handle_roommate_set_up()

        empty_response = self.app.get("/roommate_expense", json={}, headers=headers)
        empty_data = json.loads(empty_response.data)
        self.assertEqual(empty_response.status_code, 200)
        self.assertEqual(empty_data, [])

        self.app.post("/expense_period", json={}, headers=headers)
        self.app.post(
            "/expense",
            json={
                "title": "rent",
                "cost": "1000",
                "description": "unrealistically cheap rent",
                "expenses": [
                    {"username": "johndoe", "percentage": 0.4},
                ],
            },
            headers=headers,
        )
        response = self.app.get("/roommate_expense", json={}, headers=headers)
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["percentage"], 0.4)

    def test_no_room_create_expense_period(self):
        self.register_user("John", "Doe", "johndoe", "password")
        token = self.login_user("johndoe", "password")
        headers = {"Authorization": f"Bearer {token}"}

        response = self.app.post("/expense_period", json={}, headers=headers)
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertEqual(data["room_id"], None)

    def test_normal_create_expense_period(self):
        headers = self.handle_roommate_set_up()
        response = self.app.post("/expense_period", json={}, headers=headers)
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 201)

        room_response = self.app.get("/room", json={}, headers=headers)
        room_data = json.loads(room_response.data)
        self.assertEqual(data["room_fkey"], room_data["room_id"])
        self.assertEqual(data["open"], True)

    def test_get_expense_period_with_no_expense_periods(self):
        headers = self.handle_roommate_set_up()
        response = self.app.get("/expense_period", json={}, headers=headers)
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data, [])

    def test_normal_get_expense_period(self):
        headers = self.handle_roommate_set_up()
        for i in range(5):
            self.app.post("/expense_period", json={}, headers=headers)

        response = self.app.get("/expense_period", json={}, headers=headers)
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data), 5)

    def test_close_expense_period(self):
        headers = self.handle_roommate_set_up()

        close_response = self.app.put("/expense_period", json={}, headers=headers)
        close_data = json.loads(close_response.data)
        self.assertEqual(close_response.status_code, 404)
        self.assertEqual(close_data["message"], "Open expense period not found")

        self.app.post("/expense_period", json={}, headers=headers)

        get_response = self.app.get("/expense_period", json={}, headers=headers)
        get_data = json.loads(get_response.data)
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(len(get_data), 1)

        close_response_1 = self.app.put("/expense_period", json={}, headers=headers)
        close_data_1 = json.loads(close_response_1.data)
        self.assertEqual(close_response_1.status_code, 201)
        self.assertEqual(close_data_1["open"], True)
        get_response = self.app.get("/expense_period", json={}, headers=headers)
        get_data = json.loads(get_response.data)
        self.assertEqual(len(get_data), 2)

    def test_delete_expense_period(self):
        headers = self.handle_roommate_set_up()

        self.app.post("/expense_period", json={}, headers=headers)
        get_response = self.app.get("/expense_period", json={}, headers=headers)
        get_data = json.loads(get_response.data)
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(len(get_data), 1)

        delete_response = self.app.delete(
            "/expense_period", json={"id": get_data[0]["id"]}, headers=headers
        )
        self.assertEqual(delete_response.status_code, 200)
        delete_data = json.loads(delete_response.data)
        self.assertEqual(delete_data["message"], "Expense period deleted successfully")

        get_response_1 = self.app.get("/expense_period", json={}, headers=headers)
        get_data_1 = json.loads(get_response_1.data)
        self.assertEqual(get_response_1.status_code, 200)
        self.assertEqual(len(get_data_1), 0)


if __name__ == "__main__":
    unittest.main()
