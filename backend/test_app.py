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
    event_id = response.get_json()['id']

    # Update liveEnabled to False
    update_res = client.put(f'/api/events/{event_id}', json={
        'liveEnabled': False
    })
    assert update_res.status_code == 200
    updated_data = update_res.get_json()
    assert updated_data['liveEnabled'] == False

    # Verify it persisted
    get_res = client.get(f'/api/events/{event_id}')
    assert get_res.get_json()['liveEnabled'] == False

def test_unauthenticated_api_vulnerability(client):
    """
    This test highlights that ANY user can delete an event without the unlock code.
    This was identified as a HIGH severity vulnerability in the QA report.
    """
    # Create event with a secure unlock code
    create_res = client.post('/api/events', json={
        'name': 'Secure Event',
        'unlockCode': '9999'
    })
    event_id = create_res.get_json()['id']

    # A malicious user can just send a DELETE request directly to the API
    # without providing the unlock code
    delete_res = client.delete(f'/api/events/{event_id}')
    assert delete_res.status_code == 204

    # Verify event is actually deleted
    get_res = client.get(f'/api/events/{event_id}')
    assert get_res.status_code == 404
