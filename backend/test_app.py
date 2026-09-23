import os
import tempfile
import pytest
from pathlib import Path

# Need to set this before importing app
os.environ['TESTING'] = 'true'

import app as backend_app

@pytest.fixture
def client():
    # Use a temporary directory for tests
    with tempfile.TemporaryDirectory() as temp_dir:
        # Override config dir to use temp dir
        backend_app.CONFIG_DIR = Path(temp_dir)
        backend_app.em.events_file = Path(temp_dir) / 'events.json'
        backend_app.em.events = []
        
        backend_app.app.config['TESTING'] = True
        with backend_app.app.test_client() as client:
            yield client

def test_create_and_get_event(client):
    """Test that we can create an event and retrieve it."""
    # Create event
    response = client.post('/api/events', json={
        'name': 'Test Event',
        'description': 'A test event description',
        'unlockCode': '1111'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == 'Test Event'
    assert data['description'] == 'A test event description'
    assert data['liveEnabled'] == True # Default should be true
    event_id = data['id']

    # Get event
    response = client.get(f'/api/events/{event_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == event_id
    assert data['name'] == 'Test Event'

def test_update_event_live_status(client):
    """Test updating the liveEnabled status of an event."""
    # Create event
    response = client.post('/api/events', json={
        'name': 'Live Toggle Event'
    })
    data = response.get_json()
    event_id = data['id']
    token = data['token']

    # Update liveEnabled to False
    update_res = client.put(f'/api/events/{event_id}', json={
        'liveEnabled': False
    }, headers={'Authorization': f'Bearer {token}'})
    
    assert update_res.status_code == 200
    updated_data = update_res.get_json()
    assert updated_data['liveEnabled'] == False

    # Verify it persisted
    get_res = client.get(f'/api/events/{event_id}')
    assert get_res.get_json()['liveEnabled'] == False

def test_unauthenticated_api_vulnerability_fixed(client):
    """
    Test that endpoints are now protected against unauthenticated access.
    """
    # Create event with a secure unlock code
    create_res = client.post('/api/events', json={
        'name': 'Secure Event',
        'unlockCode': '9999'
    })
    event_id = create_res.get_json()['id']

    # A malicious user tries to send a DELETE request directly to the API
    delete_res = client.delete(f'/api/events/{event_id}')
    assert delete_res.status_code == 401 # Unauthorized

    # Verify event still exists
    get_res = client.get(f'/api/events/{event_id}')
    assert get_res.status_code == 200


def test_verify_live_pin(client):
    """Test that Live PIN verification works correctly."""
    # Create event with a specific live pin
    response = client.post('/api/events', json={
        'name': 'Live Pin Event',
        'unlockCode': '1111',
        'livePin': '5678'
    })
    assert response.status_code == 201
    event_id = response.get_json()['id']

    # Test invalid live pin
    invalid_res = client.post(f'/api/events/{event_id}/verify-live-pin', json={
        'livePin': '0000'
    })
    assert invalid_res.status_code == 401
    assert 'Incorrect live PIN' in invalid_res.get_json().get('error', '')

    # Test valid live pin
    valid_res = client.post(f'/api/events/{event_id}/verify-live-pin', json={
        'livePin': '5678'
    })
    assert valid_res.status_code == 200
    data = valid_res.get_json()
    assert data.get('success') is True
    assert 'token' in data
    
    # Verify the token decodes properly
    token = data['token']
    assert len(token) > 20

def test_socket_performer_auth():
    """Test that socketio auth requires valid token."""
    # We will test the python functions directly for simplicity since testing 
    # flask-socketio events directly requires setting up the socket test client.
    from app import verify_live_token, generate_live_token, app
    
    with app.test_request_context():
        # Generate token
        token = generate_live_token('test-event-123')
        
        # Valid verification
        assert verify_live_token(token, 'test-event-123') is True
        
        # Invalid event id
        assert verify_live_token(token, 'wrong-event') is False
        
        # Invalid token
        assert verify_live_token('bad.token.string', 'test-event-123') is False
