from datetime import datetime, timedelta
from unittest.mock import Mock

import pytest
from flask_jwt_extended import create_access_token

from app import app
from database import db
from models.chore import Chore
from models.roommate import Room, Roommate
from routes.chore import rotate_chore


@pytest.fixture
def client():
    """
    Pytest fixture to provide a Flask test client.
    We rely on DATABASE_URL and JWT_SECRET_KEY
    being set in the environment (via Docker Compose).
    """
    app.config["TESTING"] = True

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()


@pytest.fixture
def test_data(client):
    """
    Fixture that sets up initial database data:
    - One Room
    - Two Roommates
    - One Chore
    Returns IDs so tests can reference them.
    """
    with app.app_context():
        # Create a room
        room = Room(name="Test Room", invite_code="TEST1")
        db.session.add(room)
        db.session.flush()

        # Create roommates
        roommate1 = Roommate(
            first_name="John",
            last_name="Doe",
            username="john",
            password_hash="hash1",
            room_fkey=room.id,
        )
        roommate2 = Roommate(
            first_name="Jane",
            last_name="Smith",
            username="jane",
            password_hash="hash2",
            room_fkey=room.id,
        )
        db.session.add_all([roommate1, roommate2])
        db.session.flush()

        # Create a test chore
        chore = Chore(
            description="Test Chore",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=1),
            is_task=True,
            completed=False,
            recurrence="none",
            assignee_fkey=roommate1.id,
            assignor_fkey=roommate1.id,
            rotation_order=[roommate1.id, roommate2.id],
        )
        db.session.add(chore)
        db.session.commit()

        return {
            "room_id": room.id,
            "roommate1_id": roommate1.id,
            "roommate2_id": roommate2.id,
            "chore_id": chore.id,
        }


# --------------------------------------------------------------------------------
# UNIT TESTS (examples for rotation logic)
# --------------------------------------------------------------------------------


def test_rotate_chore_daily():
    """Test rotating a daily chore."""
    with app.app_context():
        # Use mock roommates for simplicity
        roommate1 = Mock(id=1)
        roommate2 = Mock(id=2)

        chore = Chore(
            description="Daily Chore",
            start_date=datetime.now() - timedelta(days=2),
            end_date=datetime.now() - timedelta(days=1),
            is_task=True,
            completed=True,
            recurrence="daily",
            assignee_fkey=roommate1.id,
            rotation_order=[roommate1.id, roommate2.id],
        )

        rotate_chore(chore)

        assert (
            chore.assignee_fkey == chore.rotation_order[1]
        )  # Should switch to roommate2
        assert chore.completed is False
        assert (chore.end_date - chore.start_date).days == 1


def test_rotate_chore_weekly():
    """Test rotating a weekly chore."""
    with app.app_context():
        roommate1 = Mock(id=1)
        roommate2 = Mock(id=2)

        chore = Chore(
            description="Weekly Chore",
            start_date=datetime.now() - timedelta(weeks=2),
            end_date=datetime.now() - timedelta(weeks=1),
            is_task=True,
            completed=True,
            recurrence="weekly",
            assignee_fkey=roommate1.id,
            rotation_order=[roommate1.id, roommate2.id],
        )

        rotate_chore(chore)

        assert chore.assignee_fkey == chore.rotation_order[1]
        assert chore.completed is False
        assert (chore.end_date - chore.start_date).days == 7


def test_rotate_chore_monthly():
    """Test rotating a monthly chore."""
    with app.app_context():
        roommate1 = Mock(id=1)
        roommate2 = Mock(id=2)

        start_date = datetime.now().replace(day=1) - timedelta(days=32)
        end_date = datetime.now().replace(day=1) - timedelta(days=1)

        chore = Chore(
            description="Monthly Chore",
            start_date=start_date,
            end_date=end_date,
            is_task=True,
            completed=True,
            recurrence="monthly",
            assignee_fkey=roommate1.id,
            rotation_order=[roommate1.id, roommate2.id],
        )

        rotate_chore(chore)

        assert chore.assignee_fkey == chore.rotation_order[1]
        assert chore.completed is False
        # At a minimum, ensure the month changed:
        assert chore.start_date.month != start_date.month


# --------------------------------------------------------------------------------
# INTEGRATION TESTS (examples for Flask endpoints)
# --------------------------------------------------------------------------------


def test_get_chores(client, test_data):
    """Test GET /chores endpoint."""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/chores", headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert "chores" in data
    assert len(data["chores"]) == 1
    assert data["chores"][0]["description"] == "Test Chore"


def test_create_chore(client, test_data):
    """Test POST /chores endpoint."""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    post_data = {
        "description": "New Chore",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=1)).isoformat(),
        "is_task": True,
        "recurrence": "none",
        "assigned_roommate_id": test_data["roommate2_id"],
        "rotation_order": [test_data["roommate1_id"], test_data["roommate2_id"]],
    }

    response = client.post("/chores", json=post_data, headers=headers)
    assert response.status_code == 201

    response_data = response.get_json()
    assert response_data["chore"]["description"] == "New Chore"
    assert (
        response_data["chore"]["assigned_roommate"]["id"] == test_data["roommate2_id"]
    )


def test_update_chore(client, test_data):
    """Test PUT /chores/<id> endpoint."""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    update_data = {"description": "Updated Chore", "completed": True}

    response = client.put(
        f'/chores/{test_data["chore_id"]}', json=update_data, headers=headers
    )
    assert response.status_code == 200

    response_data = response.get_json()
    assert response_data["chore"]["description"] == "Updated Chore"
    assert response_data["chore"]["completed"] is True


def test_delete_chore(client, test_data):
    """Test DELETE /chores/<id> endpoint."""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.delete(f'/chores/{test_data["chore_id"]}', headers=headers)
    assert response.status_code == 204  # 204 No Content indicates successful DELETE


def test_create_recurring_chore(client, test_data):
    """Test creating a recurring chore (e.g., daily)."""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    post_data = {
        "description": "Recurring Chore",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=1)).isoformat(),
        "is_task": True,
        "recurrence": "daily",
        "assigned_roommate_id": test_data["roommate2_id"],
        "rotation_order": [test_data["roommate1_id"], test_data["roommate2_id"]],
    }

    response = client.post("/chores", json=post_data, headers=headers)
    assert response.status_code == 201

    response_data = response.get_json()
    assert response_data["chore"]["description"] == "Recurring Chore"
    assert response_data["chore"]["recurrence"] == "daily"


def test_unauthorized_access(client):
    """Test accessing endpoints without authorization should fail (401)."""
    response = client.get("/chores")
    assert response.status_code == 401
