import os
import json
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from flask_jwt_extended import create_access_token

# Set test environment variables
os.environ['DATABASE_URL'] = 'postgresql://user:secret@localhost:5432/test_database'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'

from app import app
from database import db
from models.notifications import Notification
from models.roommate import Room, Roommate

# Fixture for test client
@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:secret@localhost:5432/test_database'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

# Fixture for test data
@pytest.fixture
def test_data():
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
            room_fkey=room.id
        )
        roommate2 = Roommate(
            first_name="Jane",
            last_name="Smith",
            username="jane",
            password_hash="hash2",
            room_fkey=room.id
        )
        db.session.add_all([roommate1, roommate2])
        db.session.flush()

        # Create a test notification using the actual Notification model
        notification1 = Notification(
            title="Test Notification 1",
            notification_time=datetime.utcnow(),
            notification_sender=roommate1.id,
            notification_recipient=roommate1.id,
            room_fkey=room.id
        )
        notification2 = Notification(
            title="Test Notification 2",
            description="with description",
            notification_time=datetime.utcnow(),
            notification_sender=roommate1.id,
            notification_recipient=roommate2.id,
            room_fkey=room.id
        )
        notification3 = Notification(
            description="test notification 3 without title",
            notification_time=datetime.utcnow(),
            notification_sender=roommate2.id,
            notification_recipient=roommate1.id,
            room_fkey=room.id
        )
        
        db.session.add(notification1)
        db.session.add(notification2)
        db.session.add(notification3)
        db.session.commit()

        return {
            'room_id': room.id,
            'roommate1_id': roommate1.id,
            'roommate2_id': roommate2.id,
            'notification1_id': notification1.id,
            'notification2_id': notification2.id,
            'notification3_id': notification3.id
        }

# # Integration Tests

# Test GET /notifications endpoint

def test_get_notification_by_id(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data['roommate1_id']))

    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        "notification_id": test_data['notification2_id']
    }
    response = client.get('/notifications', json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == test_data['notification2_id']
    assert data['title'] == "Test Notification 2"
    assert data['description'] == "with description"
    assert data['notification_sender'] == test_data['roommate1_id']
    assert data['notification_recipient'] == test_data['roommate2_id']
    
def test_get_notification_by_sender(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data['roommate1_id']))

    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        "notification_sender": test_data['roommate2_id']
    }
    response = client.get('/notifications', json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['id'] == test_data['notification3_id']
    assert data[0]['title'] == None
    assert data[0]['description'] == "test notification 3 without title"
    assert data[0]['notification_sender'] == test_data['roommate2_id']
    assert data[0]['notification_recipient'] == test_data['roommate1_id']

def test_get_notification_by_recipient(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data['roommate1_id']))

    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        "notification_recipient": test_data['roommate1_id']
    }
    response = client.get('/notifications', json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    assert data[0]['id'] == test_data['notification1_id']
    assert data[0]['title'] == "Test Notification 1"
    assert data[0]['description'] == None
    assert data[0]['notification_sender'] == test_data['roommate1_id']
    assert data[0]['notification_recipient'] == test_data['roommate1_id']
    
def test_get_notification_by_sender_and_recipient(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data['roommate1_id']))

    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        "notification_sender": test_data['roommate1_id'],
        "notification_recipient": test_data['roommate1_id']
    }
    response = client.get('/notifications', json=data, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['id'] == test_data['notification1_id']
    assert data[0]['title'] == "Test Notification 1"
    assert data[0]['description'] == None
    assert data[0]['notification_sender'] == test_data['roommate1_id']
    assert data[0]['notification_recipient'] == test_data['roommate1_id']

def test_get_all_notifications(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data['roommate1_id']))

    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.get('/notifications', headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 3
    assert data[0]['id'] != data[1]['id']
    assert data[1]['id'] != data[2]['id']
    
    
# Test POST /notifications endpoint
def test_create_notification(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data['roommate1_id']))
    
    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        'title': 'New Notification',
        'notification_sender': test_data['roommate2_id'],
        'notification_recipient': test_data['roommate1_id']
    }
    
    response = client.post('/notifications', json=data, headers=headers)
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['title'] == "New Notification"
    assert data['description'] == None
    assert data['notification_sender'] == test_data['roommate2_id']
    assert data['notification_recipient'] == test_data['roommate1_id']
   
# Test PUT /notifications endpoint 
def test_update_notification(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data['roommate1_id']))
    
    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        'notification_id': test_data['notification1_id'],
        'title': "Updated Title"
    }
    
    response = client.put('/notifications', json=data, headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == test_data['notification1_id']
    assert data['title'] == "Updated Title"
    assert data['description'] == None
    assert data['notification_sender'] == test_data['roommate1_id']
    assert data['notification_recipient'] == test_data['roommate1_id']
    
       
# Test DELETE /notifications endpoint 
def test_delete_notification(client, test_data):
    with app.app_context():
        access_token = create_access_token(identity=str(test_data['roommate1_id']))
    
    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        'notification_id': test_data['notification1_id'],
    }
    
    response = client.delete('/notifications', json=data, headers=headers)
    
    assert response.status_code == 204