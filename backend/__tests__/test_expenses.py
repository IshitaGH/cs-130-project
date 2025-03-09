import pytest
from flask_jwt_extended import create_access_token
from flask import g

from app import app
from database import db
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
    - One Roommate
    Returns IDs so tests can reference them.
    """
    with app.app_context():
        # Create a room
        room = Room(name="Test Room", invite_code="TEST1")
        db.session.add(room)
        db.session.flush()

        # Create roommate
        roommate = Roommate(
            first_name="John",
            last_name="Doe",
            username="johndoe",
            password_hash="password",  # In a real test, you'd hash this
            room_fkey=room.id,
        )
        db.session.add(roommate)
        db.session.commit()

        return {
            "room_id": room.id,
            "roommate_id": roommate.id,
        }


def test_no_room_create_expense(client):
    """Test creating an expense without being in a room"""
    with app.app_context():
        # Create a roommate without a room
        roommate = Roommate(
            first_name="John",
            last_name="Doe",
            username="noroom",
            password_hash="password",
        )
        db.session.add(roommate)
        db.session.commit()
        
        access_token = create_access_token(identity=str(roommate.id))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.post("/expense", json={"expenses": []}, headers=headers)
    
    assert response.status_code == 404
    data = response.get_json()
    assert data["room_id"] is None


def test_no_expense_period_create_expense(client, test_data):
    """Test creating an expense without an open expense period"""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate_id"]))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.post("/expense", json={"expenses": []}, headers=headers)
    
    assert response.status_code == 404
    data = response.get_json()
    assert data["message"] == "Open expense period not found"


def test_normal_create_expense(client, test_data):
    """Test creating an expense normally"""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate_id"]))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # First create an expense period
    client.post("/expense_period", json={}, headers=headers)
    
    # Then create an expense
    response = client.post(
        "/expense",
        json={
            "title": "rent",
            "cost": "1000",
            "description": "unrealistically cheap rent",
        },
        headers=headers,
    )
    
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "rent"
    assert data["cost"] == 1000
    assert data["description"] == "unrealistically cheap rent"
    
    # Create another expense period and expense
    client.post("/expense_period", json={}, headers=headers)
    response = client.post(
        "/expense",
        json={
            "title": "vacuum",
            "cost": "500",
            "description": "need to clean",
            "roommate_spendor_id": test_data["roommate_id"],
        },
        headers=headers,
    )
    
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "vacuum"
    assert data["cost"] == 500
    assert data["description"] == "need to clean"


def test_get_roommate_expense(client, test_data):
    """Test getting roommate expenses"""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate_id"]))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Check empty response first
    with app.test_request_context(headers=headers):
        # Set g.user_id manually for the test
        g.user_id = test_data["roommate_id"]
        empty_response = client.get("/roommate_expense", headers=headers)
    
    assert empty_response.status_code == 200
    empty_data = empty_response.get_json()
    assert empty_data == []
    
    # Create expense period and expense
    with app.test_request_context(headers=headers):
        g.user_id = test_data["roommate_id"]
        client.post("/expense_period", json={}, headers=headers)
    
    with app.test_request_context(headers=headers):
        g.user_id = test_data["roommate_id"]
        client.post(
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
    
    # Get roommate expenses
    with app.test_request_context(headers=headers):
        g.user_id = test_data["roommate_id"]
        response = client.get("/roommate_expense", headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["percentage"] == 0.4


def test_no_room_create_expense_period(client):
    """Test creating an expense period without being in a room"""
    with app.app_context():
        # Create a roommate without a room
        roommate = Roommate(
            first_name="John",
            last_name="Doe",
            username="noroom2",
            password_hash="password",
        )
        db.session.add(roommate)
        db.session.commit()
        
        access_token = create_access_token(identity=str(roommate.id))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.post("/expense_period", json={}, headers=headers)
    
    assert response.status_code == 404
    data = response.get_json()
    assert data["room_id"] is None


def test_normal_create_expense_period(client, test_data):
    """Test creating an expense period normally"""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate_id"]))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.post("/expense_period", json={}, headers=headers)
    
    assert response.status_code == 201
    data = response.get_json()
    assert data["room_fkey"] == test_data["room_id"]
    assert data["open"] is True


def test_get_expense_period_with_no_expense_periods(client, test_data):
    """Test getting expense periods when none exist"""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate_id"]))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/expense_period", headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data == []


def test_normal_get_expense_period(client, test_data):
    """Test getting expense periods normally"""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate_id"]))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create 5 expense periods
    for i in range(5):
        client.post("/expense_period", json={}, headers=headers)
    
    response = client.get("/expense_period", headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 5


def test_close_expense_period(client, test_data):
    """Test closing an expense period"""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate_id"]))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Try to close when none exist
    close_response = client.put("/expense_period", json={}, headers=headers)
    assert close_response.status_code == 404
    close_data = close_response.get_json()
    assert close_data["message"] == "Open expense period not found"
    
    # Create an expense period
    client.post("/expense_period", json={}, headers=headers)
    
    # Verify it exists
    get_response = client.get("/expense_period", headers=headers)
    assert get_response.status_code == 200
    get_data = get_response.get_json()
    assert len(get_data) == 1
    
    # Close it and verify a new one is created
    close_response = client.put("/expense_period", json={}, headers=headers)
    assert close_response.status_code == 201
    close_data = close_response.get_json()
    assert close_data["open"] is True
    
    # Verify we now have two expense periods
    get_response = client.get("/expense_period", headers=headers)
    get_data = get_response.get_json()
    assert len(get_data) == 2


def test_delete_expense_period(client, test_data):
    """Test deleting an expense period"""
    with app.app_context():
        access_token = create_access_token(identity=str(test_data["roommate_id"]))
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create an expense period
    client.post("/expense_period", json={}, headers=headers)
    
    # Get its ID
    get_response = client.get("/expense_period", headers=headers)
    get_data = get_response.get_json()
    assert len(get_data) == 1
    
    # Delete it
    delete_response = client.delete(
        "/expense_period", json={"id": get_data[0]["id"]}, headers=headers
    )
    assert delete_response.status_code == 200
    delete_data = delete_response.get_json()
    assert delete_data["message"] == "Expense period deleted successfully"
    
    # Verify it's gone
    get_response = client.get("/expense_period", headers=headers)
    get_data = get_response.get_json()
    assert len(get_data) == 0 