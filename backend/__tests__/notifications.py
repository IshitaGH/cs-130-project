import pytest
from datetime import datetime
from flask_jwt_extended import create_access_token

from app import app
from database import db
from models.notifications import Notification
from models.roommate import Room, Roommate


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
    - Sample Notifications
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
        db.session.add(roommate1)
        db.session.add(roommate2)
        db.session.flush()

        # Create notifications
        notification1 = Notification(
            sender_id=roommate1.id,
            recipient_id=roommate1.id,
            title="Test Notification 1",
            description=None,
            read=False,
            created_at=datetime.utcnow(),
        )
        
        notification2 = Notification(
            sender_id=roommate1.id,
            recipient_id=roommate2.id,
            title="Test Notification 2",
            description="with description",
            read=False,
            created_at=datetime.utcnow(),
        )
        
        notification3 = Notification(
            sender_id=roommate2.id,
            recipient_id=roommate1.id,
            title=None,
            description="test notification 3 without title",
            read=False,
            created_at=datetime.utcnow(),
        )
        
        db.session.add(notification1)
        db.session.add(notification2)
        db.session.add(notification3)
        db.session.commit()

        return {
            "room_id": room.id,
            "roommate1_id": roommate1.id,
            "roommate2_id": roommate2.id,
            "notification_id": notification1.id,
        }


# # Integration Tests

# Test GET /notifications endpoint


def test_get_notification_by_id(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    data = {"notification_id": test_data["notification_id"]}
    response = client.get("/notifications", json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == test_data["notification_id"]
    assert data["title"] == "Test Notification 2"
    assert data["description"] == "with description"
    assert data["notification_sender"] == test_data["roommate1_id"]
    assert data["notification_recipient"] == test_data["roommate2_id"]


def test_get_notification_by_sender(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    data = {"notification_sender": test_data["roommate2_id"]}
    response = client.get("/notifications", json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["id"] == test_data["notification_id"]
    assert data[0]["title"] == None
    assert data[0]["description"] == "test notification 3 without title"
    assert data[0]["notification_sender"] == test_data["roommate2_id"]
    assert data[0]["notification_recipient"] == test_data["roommate1_id"]


def test_get_notification_by_recipient(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    data = {"notification_recipient": test_data["roommate1_id"]}
    response = client.get("/notifications", json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    assert data[0]["id"] == test_data["notification_id"]
    assert data[0]["title"] == "Test Notification 1"
    assert data[0]["description"] == None
    assert data[0]["notification_sender"] == test_data["roommate1_id"]
    assert data[0]["notification_recipient"] == test_data["roommate1_id"]


def test_get_notification_by_sender_and_recipient(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    data = {
        "notification_sender": test_data["roommate1_id"],
        "notification_recipient": test_data["roommate1_id"],
    }
    response = client.get("/notifications", json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["id"] == test_data["notification_id"]
    assert data[0]["title"] == "Test Notification 1"
    assert data[0]["description"] == None
    assert data[0]["notification_sender"] == test_data["roommate1_id"]
    assert data[0]["notification_recipient"] == test_data["roommate1_id"]


def test_get_all_notifications(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/notifications", headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 3
    assert data[0]["id"] != data[1]["id"]
    assert data[1]["id"] != data[2]["id"]


# Test POST /notifications endpoint
def test_create_notification(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    data = {
        "title": "New Notification",
        "notification_sender": test_data["roommate2_id"],
        "notification_recipient": test_data["roommate1_id"],
    }

    response = client.post("/notifications", json=data, headers=headers)

    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "New Notification"
    assert data["description"] == None
    assert data["notification_sender"] == test_data["roommate2_id"]
    assert data["notification_recipient"] == test_data["roommate1_id"]


# Test PUT /notifications endpoint
def test_update_notification(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    data = {"notification_id": test_data["notification_id"], "title": "Updated Title"}

    response = client.put("/notifications", json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == test_data["notification_id"]
    assert data["title"] == "Updated Title"
    assert data["description"] == None
    assert data["notification_sender"] == test_data["roommate1_id"]
    assert data["notification_recipient"] == test_data["roommate1_id"]


# Test DELETE /notifications endpoint
def test_delete_notification(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate1_id"]))

    headers = {"Authorization": f"Bearer {access_token}"}
    data = {
        "notification_id": test_data["notification_id"],
    }

    response = client.delete("/notifications", json=data, headers=headers)

    assert response.status_code == 204
