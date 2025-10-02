#!/usr/bin/env python3

import os
import json
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
import magic

app = Flask(__name__)
CORS(app)

# Configuration
CONFIG_DIR = Path.home() / '.config' / 'performance-manager'
ALLOWED_EXTENSIONS = {'mp3', 'mp4', 'aac', 'm4a', 'wav', 'flac'}

# Ensure config directory exists
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

class EventManager:
    def __init__(self):
        self.events_file = CONFIG_DIR / 'events.json'
        self.events: List[Dict[str, Any]] = []
        self.load_events()

    def load_events(self):
        """Load events from JSON file"""
        if self.events_file.exists():
            try:
                with open(self.events_file, 'r') as f:
                    self.events = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                self.events = []
        else:
            self.events = []

    def save_events(self):
        """Save events to JSON file"""
        with open(self.events_file, 'w') as f:
            json.dump(self.events, f, indent=2)

    def get_event_dir(self, event_id: str) -> Path:
        """Get directory path for an event"""
        return CONFIG_DIR / event_id

    def get_event_performances_file(self, event_id: str) -> Path:
        """Get performances file path for an event"""
        return self.get_event_dir(event_id) / 'performances.json'

    def create_event(self, name: str, description: str = '') -> Dict[str, Any]:
        """Create a new event"""
        event_id = str(uuid.uuid4())
        event_dir = self.get_event_dir(event_id)
        event_dir.mkdir(exist_ok=True)

        event = {
            'id': event_id,
            'name': name,
            'description': description,
            'createdAt': datetime.now().isoformat(),
            'performances': [],
            'breaks': []
        }

        self.events.append(event)
        self.save_events()

        # Create performances file for this event
        performances_file = self.get_event_performances_file(event_id)
        with open(performances_file, 'w') as f:
            json.dump([], f, indent=2)

        return event

    def get_event(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Get an event by ID"""
        return next((e for e in self.events if e['id'] == event_id), None)

    def delete_event(self, event_id: str) -> bool:
        """Delete an event and all its data"""
        event = self.get_event(event_id)
        if event:
            # Remove from list
            self.events = [e for e in self.events if e['id'] != event_id]

            # Delete event directory
            event_dir = self.get_event_dir(event_id)
            if event_dir.exists():
                shutil.rmtree(event_dir)

            self.save_events()
            return True
        return False

    def load_event_performances(self, event_id: str) -> List[Dict[str, Any]]:
        """Load performances for a specific event"""
        performances_file = self.get_event_performances_file(event_id)
        if performances_file.exists():
            try:
                with open(performances_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                return []
        return []

    def save_event_performances(self, event_id: str, performances: List[Dict[str, Any]]):
        """Save performances for a specific event"""
        performances_file = self.get_event_performances_file(event_id)
        with open(performances_file, 'w') as f:
            json.dump(performances, f, indent=2)

    def get_performance_dir(self, event_id: str, performance_id: str) -> Path:
        """Get directory path for a performance within an event"""
        return self.get_event_dir(event_id) / performance_id

    def create_performance(self, event_id: str, name: str, performer: str = '', perf_type: str = 'Song', mode: str = 'Solo') -> Dict[str, Any]:
        """Create a new performance within an event"""
        event = self.get_event(event_id)
        if not event:
            return None

        performances = self.load_event_performances(event_id)

        performance_id = str(uuid.uuid4())
        performance_dir = self.get_performance_dir(event_id, performance_id)
        performance_dir.mkdir(exist_ok=True)

        performance = {
            'id': performance_id,
            'name': name,
            'performer': performer,
            'type': perf_type,
            'mode': mode,
            'tracks': [],
            'isDone': False,
            'createdAt': datetime.now().isoformat(),
            'order': len(performances)
        }

        performances.append(performance)
        self.save_event_performances(event_id, performances)
        return performance

    def get_performance(self, event_id: str, performance_id: str) -> Optional[Dict[str, Any]]:
        """Get a performance by ID within an event"""
        performances = self.load_event_performances(event_id)
        return next((p for p in performances if p['id'] == performance_id), None)

    def update_performance(self, event_id: str, performance_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a performance within an event"""
        performances = self.load_event_performances(event_id)
        performance = next((p for p in performances if p['id'] == performance_id), None)

        if performance:
            performance.update(updates)
            self.save_event_performances(event_id, performances)
            return performance
        return None

    def delete_performance(self, event_id: str, performance_id: str) -> bool:
        """Delete a performance and its files within an event"""
        performances = self.load_event_performances(event_id)
        performance = next((p for p in performances if p['id'] == performance_id), None)

        if performance:
            # Remove from list
            performances = [p for p in performances if p['id'] != performance_id]

            # Delete performance directory
            performance_dir = self.get_performance_dir(event_id, performance_id)
            if performance_dir.exists():
                shutil.rmtree(performance_dir)

            self.save_event_performances(event_id, performances)
            return True
        return False

    def add_track(self, event_id: str, performance_id: str, filename: str, performer: str) -> Optional[Dict[str, Any]]:
        """Add a track to a performance within an event"""
        performances = self.load_event_performances(event_id)
        performance = next((p for p in performances if p['id'] == performance_id), None)

        if performance:
            track_id = str(uuid.uuid4())
            track = {
                'id': track_id,
                'filename': filename,
                'performer': performer,
                'url': f'/api/events/{event_id}/performances/{performance_id}/files/{filename}',
                'isCompleted': False
            }

            performance['tracks'].append(track)
            self.save_event_performances(event_id, performances)
            return track
        return None

    def reorder_performances(self, event_id: str, order: List[str]) -> bool:
        """Reorder performances within an event"""
        try:
            performances = self.load_event_performances(event_id)
            performance_map = {p['id']: p for p in performances}
            reordered = []

            for i, perf_id in enumerate(order):
                if perf_id in performance_map:
                    performance = performance_map[perf_id]
                    performance['order'] = i
                    reordered.append(performance)

            self.save_event_performances(event_id, reordered)
            return True
        except Exception:
            return False

    def update_track_completion(self, event_id: str, performance_id: str, track_id: str, is_completed: bool) -> Optional[Dict[str, Any]]:
        """Update track completion status"""
        try:
            performances = self.load_event_performances(event_id)
            performance = next((p for p in performances if p['id'] == performance_id), None)

            if performance:
                track = next((t for t in performance['tracks'] if t['id'] == track_id), None)
                if track:
                    track['isCompleted'] = is_completed
                    self.save_event_performances(event_id, performances)
                    return track
            return None
        except Exception:
            return None

    def get_event_breaks_file(self, event_id: str) -> Path:
        """Get the path to the breaks file for an event"""
        return self.get_event_dir(event_id) / 'breaks.json'

    def load_event_breaks(self, event_id: str) -> List[Dict[str, Any]]:
        """Load breaks for an event"""
        breaks_file = self.get_event_breaks_file(event_id)
        if breaks_file.exists():
            with open(breaks_file, 'r') as f:
                return json.load(f)
        return []

    def save_event_breaks(self, event_id: str, breaks: List[Dict[str, Any]]) -> None:
        """Save breaks for an event"""
        breaks_file = self.get_event_breaks_file(event_id)
        with open(breaks_file, 'w') as f:
            json.dump(breaks, f, indent=2)

    def create_break(self, event_id: str, name: str, break_type: str) -> Optional[Dict[str, Any]]:
        """Create a new break within an event"""
        breaks = self.load_event_breaks(event_id)

        break_id = str(uuid.uuid4())
        break_obj = {
            'id': break_id,
            'name': name,
            'type': break_type,
            'isDone': False,
            'createdAt': datetime.now().isoformat(),
            'order': len(breaks)
        }

        breaks.append(break_obj)
        self.save_event_breaks(event_id, breaks)
        return break_obj

    def get_break(self, event_id: str, break_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific break"""
        breaks = self.load_event_breaks(event_id)
        return next((b for b in breaks if b['id'] == break_id), None)

    def update_break(self, event_id: str, break_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a break"""
        breaks = self.load_event_breaks(event_id)
        break_obj = next((b for b in breaks if b['id'] == break_id), None)

        if break_obj:
            break_obj.update(updates)
            self.save_event_breaks(event_id, breaks)
            return break_obj
        return None

    def delete_break(self, event_id: str, break_id: str) -> bool:
        """Delete a break"""
        breaks = self.load_event_breaks(event_id)
        original_count = len(breaks)
        breaks = [b for b in breaks if b['id'] != break_id]

        if len(breaks) < original_count:
            self.save_event_breaks(event_id, breaks)
            return True
        return False

# Global event manager instance
em = EventManager()

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Event endpoints
@app.route('/api/events', methods=['GET'])
def get_events():
    """Get all events"""
    return jsonify(em.events)

@app.route('/api/events', methods=['POST'])
def create_event():
    """Create a new event"""
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400

    event = em.create_event(data['name'], data.get('description', ''))
    return jsonify(event), 201

@app.route('/api/events/<event_id>', methods=['GET'])
def get_event(event_id: str):
    """Get a specific event"""
    event = em.get_event(event_id)
    if event:
        return jsonify(event)
    return jsonify({'error': 'Event not found'}), 404

@app.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id: str):
    """Delete an event"""
    if em.delete_event(event_id):
        return '', 204
    return jsonify({'error': 'Event not found'}), 404

# Performance endpoints within events
@app.route('/api/events/<event_id>/performances', methods=['GET'])
def get_event_performances(event_id: str):
    """Get all performances for an event"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    performances = em.load_event_performances(event_id)
    return jsonify(performances)

@app.route('/api/events/<event_id>/performances', methods=['POST'])
def create_event_performance(event_id: str):
    """Create a new performance within an event"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # Check if this is a form submission with files
    if request.content_type and 'multipart/form-data' in request.content_type:
        # Handle form data with files
        name = request.form.get('name')
        performer = request.form.get('performer', '')
        perf_type = request.form.get('type', 'Song')
        mode = request.form.get('mode', 'Solo')

        if not name:
            return jsonify({'error': 'Name is required'}), 400

        # Create performance
        performance = em.create_performance(event_id, name, performer, perf_type, mode)
        if not performance:
            return jsonify({'error': 'Failed to create performance'}), 500

        # Handle file uploads
        files = request.files.getlist('files')
        for file in files:
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                performance_dir = em.get_performance_dir(event_id, performance['id'])
                file_path = performance_dir / filename

                # Handle duplicate filenames
                counter = 1
                original_name, ext = os.path.splitext(filename)
                while file_path.exists():
                    filename = f"{original_name}_{counter}{ext}"
                    file_path = performance_dir / filename
                    counter += 1

                file.save(file_path)

                # Add track to performance
                track = em.add_track(event_id, performance['id'], filename, performer)

        # Return updated performance with tracks
        updated_performance = em.get_performance(event_id, performance['id'])
        return jsonify(updated_performance), 201
    else:
        # Handle JSON data (for backward compatibility)
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': 'Name is required'}), 400

        performance = em.create_performance(
            event_id,
            data['name'],
            data.get('performer', ''),
            data.get('type', 'Song'),
            data.get('mode', 'Solo')
        )
        if performance:
            return jsonify(performance), 201
        return jsonify({'error': 'Failed to create performance'}), 500

@app.route('/api/events/<event_id>/performances/<performance_id>', methods=['GET'])
def get_event_performance(event_id: str, performance_id: str):
    """Get a specific performance within an event"""
    performance = em.get_performance(event_id, performance_id)
    if performance:
        return jsonify(performance)
    return jsonify({'error': 'Performance not found'}), 404

@app.route('/api/events/<event_id>/performances/<performance_id>', methods=['PUT'])
def update_event_performance(event_id: str, performance_id: str):
    """Update a performance within an event"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    performance = em.update_performance(event_id, performance_id, data)
    if performance:
        return jsonify(performance)
    return jsonify({'error': 'Performance not found'}), 404

@app.route('/api/events/<event_id>/performances/<performance_id>', methods=['DELETE'])
def delete_event_performance(event_id: str, performance_id: str):
    """Delete a performance within an event"""
    if em.delete_performance(event_id, performance_id):
        return '', 204
    return jsonify({'error': 'Performance not found'}), 404

@app.route('/api/events/<event_id>/performances/<performance_id>/upload', methods=['POST'])
def upload_event_track(event_id: str, performance_id: str):
    """Upload a track file to a performance within an event"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    performer = request.form.get('performer', 'Unknown')

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    # Check if event and performance exist
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    performance = em.get_performance(event_id, performance_id)
    if not performance:
        return jsonify({'error': 'Performance not found'}), 404

    # Save file
    filename = secure_filename(file.filename)
    performance_dir = em.get_performance_dir(event_id, performance_id)
    file_path = performance_dir / filename

    # Handle duplicate filenames
    counter = 1
    original_name, ext = os.path.splitext(filename)
    while file_path.exists():
        filename = f"{original_name}_{counter}{ext}"
        file_path = performance_dir / filename
        counter += 1

    file.save(file_path)

    # Add track to performance
    track = em.add_track(event_id, performance_id, filename, performer)
    if track:
        return jsonify(track), 201

    return jsonify({'error': 'Failed to add track'}), 500

@app.route('/api/events/<event_id>/performances/<performance_id>/files/<filename>')
def serve_event_track_file(event_id: str, performance_id: str, filename: str):
    """Serve audio files with range support for streaming"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    performance = em.get_performance(event_id, performance_id)
    if not performance:
        return jsonify({'error': 'Performance not found'}), 404

    file_path = em.get_performance_dir(event_id, performance_id) / secure_filename(filename)

    if not file_path.exists():
        return jsonify({'error': 'File not found'}), 404

    # Handle range requests for audio streaming
    range_header = request.headers.get('Range', None)
    if not range_header:
        return send_file(file_path)

    # Parse range header
    byte_start = 0
    byte_end = None
    file_size = file_path.stat().st_size

    if range_header:
        match = range_header.replace('bytes=', '').split('-')
        byte_start = int(match[0]) if match[0] else 0
        byte_end = int(match[1]) if match[1] else file_size - 1

    if byte_end is None:
        byte_end = file_size - 1

    # Read file chunk
    chunk_size = byte_end - byte_start + 1

    def generate():
        with open(file_path, 'rb') as f:
            f.seek(byte_start)
            data = f.read(chunk_size)
            yield data

    rv = Response(generate(),
                  206,
                  headers={
                      "Content-Range": f"bytes {byte_start}-{byte_end}/{file_size}",
                      "Accept-Ranges": "bytes",
                      "Content-Length": str(chunk_size),
                      "Content-Type": "audio/mpeg",
                  }
                  )
    return rv

@app.route('/api/events/<event_id>/performances/reorder', methods=['POST'])
def reorder_event_performances(event_id: str):
    """Reorder performances within an event"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()
    if not data or 'order' not in data:
        return jsonify({'error': 'Order array is required'}), 400

    if em.reorder_performances(event_id, data['order']):
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to reorder performances'}), 500

@app.route('/api/events/<event_id>/performances/<performance_id>/tracks/<track_id>/completion', methods=['PUT'])
def update_track_completion(event_id: str, performance_id: str, track_id: str):
    """Update track completion status"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    performance = em.get_performance(event_id, performance_id)
    if not performance:
        return jsonify({'error': 'Performance not found'}), 404

    data = request.get_json()
    if not data or 'isCompleted' not in data:
        return jsonify({'error': 'isCompleted field is required'}), 400

    updated_track = em.update_track_completion(event_id, performance_id, track_id, data['isCompleted'])
    if updated_track:
        return jsonify(updated_track)
    return jsonify({'error': 'Track not found or failed to update'}), 404

# Break endpoints
@app.route('/api/events/<event_id>/breaks', methods=['GET'])
def get_event_breaks(event_id: str):
    """Get all breaks for an event"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    breaks = em.load_event_breaks(event_id)
    return jsonify(breaks)

@app.route('/api/events/<event_id>/breaks', methods=['POST'])
def create_event_break(event_id: str):
    """Create a new break within an event"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()
    if not data or 'name' not in data or 'type' not in data:
        return jsonify({'error': 'Name and type are required'}), 400

    # Validate break type
    valid_types = ['Lunch', 'Dinner', 'Broadcast', 'Announcement', 'Appearence', 'Special Show']
    if data['type'] not in valid_types:
        return jsonify({'error': f'Invalid break type. Must be one of: {", ".join(valid_types)}'}), 400

    break_obj = em.create_break(event_id, data['name'], data['type'])
    if break_obj:
        return jsonify(break_obj), 201

    return jsonify({'error': 'Failed to create break'}), 500

@app.route('/api/events/<event_id>/breaks/<break_id>', methods=['PUT'])
def update_event_break(event_id: str, break_id: str):
    """Update a break"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Validate break type if provided
    if 'type' in data:
        valid_types = ['Lunch', 'Dinner', 'Broadcast', 'Announcement', 'Appearence', 'Special Show']
        if data['type'] not in valid_types:
            return jsonify({'error': f'Invalid break type. Must be one of: {", ".join(valid_types)}'}), 400

    break_obj = em.update_break(event_id, break_id, data)
    if break_obj:
        return jsonify(break_obj)

    return jsonify({'error': 'Break not found'}), 404

@app.route('/api/events/<event_id>/breaks/<break_id>', methods=['DELETE'])
def delete_event_break(event_id: str, break_id: str):
    """Delete a break"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if em.delete_break(event_id, break_id):
        return jsonify({'message': 'Break deleted successfully'})

    return jsonify({'error': 'Break not found'}), 404

@app.route('/api/events/<event_id>/breaks/reorder', methods=['POST'])
def reorder_event_breaks(event_id: str):
    """Reorder breaks within an event"""
    event = em.get_event(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()
    if not data or 'order' not in data:
        return jsonify({'error': 'Order array is required'}), 400

    new_order = data['order']
    if not isinstance(new_order, list):
        return jsonify({'error': 'Order must be an array'}), 400

    breaks = em.load_event_breaks(event_id)

    # Create a mapping of id to break
    break_map = {b['id']: b for b in breaks}

    # Reorder breaks according to new_order and update order field
    reordered_breaks = []
    for index, break_id in enumerate(new_order):
        if break_id in break_map:
            break_obj = break_map[break_id].copy()
            break_obj['order'] = index
            reordered_breaks.append(break_obj)

    # Add any breaks not in the new order at the end
    for break_obj in breaks:
        if break_obj['id'] not in new_order:
            break_obj['order'] = len(reordered_breaks)
            reordered_breaks.append(break_obj)

    em.save_event_breaks(event_id, reordered_breaks)
    return jsonify({'message': 'Breaks reordered successfully'})

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'config_dir': str(CONFIG_DIR)})

# Serve frontend files
@app.route('/')
def serve_frontend():
    """Serve the frontend index.html"""
    frontend_path = Path(__file__).parent.parent / 'frontend' / 'dist'
    index_file = frontend_path / 'index.html'
    if index_file.exists():
        return send_file(index_file)
    return jsonify({'error': 'Frontend not built'}), 404

@app.route('/<path:path>')
def serve_static(path):
    """Serve static frontend files"""
    frontend_path = Path(__file__).parent.parent / 'frontend' / 'dist'
    file_path = frontend_path / path
    if file_path.exists() and file_path.is_file():
        return send_file(file_path)
    return serve_frontend()  # Fallback to index.html for SPA routing

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Performance Manager Backend')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on (default: 5000)')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind the server to (default: 0.0.0.0)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    args = parser.parse_args()

    print(f"Performance Manager starting...")
    print(f"Config directory: {CONFIG_DIR}")
    print(f"Serving frontend from: {Path(__file__).parent.parent / 'frontend' / 'dist'}")
    print(f"Server will run on {args.host}:{args.port}")

    app.run(host=args.host, port=args.port, debug=args.debug)