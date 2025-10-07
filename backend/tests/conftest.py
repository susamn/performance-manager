"""
Pytest configuration and fixtures for Performance Manager backend tests
"""

import pytest
import tempfile
import shutil
import json
from pathlib import Path
import sys
import os

# Add parent directory to path to import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import EventManager, file_lock


@pytest.fixture
def temp_dir():
    """Create a temporary directory for test data"""
    test_dir = Path(tempfile.mkdtemp())
    yield test_dir
    shutil.rmtree(test_dir)


@pytest.fixture
def event_manager(temp_dir):
    """Create an EventManager instance with temporary directory"""
    em = EventManager()
    # Override config paths for testing
    em.events_file = temp_dir / 'events.json'
    em.events = []
    return em


@pytest.fixture
def event_id():
    """Standard test event ID"""
    return 'test-event-123'


@pytest.fixture
def event_dir(temp_dir, event_id):
    """Create event directory"""
    event_dir = temp_dir / event_id
    event_dir.mkdir(parents=True, exist_ok=True)
    return event_dir


@pytest.fixture
def sample_performances():
    """Create sample performances for testing"""
    performances = []
    for i in range(10):
        performances.append({
            'id': f'perf-{i}',
            'name': f'Performance {i}' if i not in [2, 5, 7] else f'Special {i}',
            'performer': f'Artist {i}',
            'type': 'Song',
            'mode': 'Solo',
            'tracks': [],
            'isDone': False,
            'order': i
        })
    return performances


@pytest.fixture
def sample_breaks():
    """Create sample breaks for testing"""
    breaks = []
    for i in range(5):
        breaks.append({
            'id': f'break-{i}',
            'name': f'Break {i}',
            'type': 'Lunch' if i % 2 == 0 else 'Dinner',
            'isDone': False,
            'order': i
        })
    return breaks


@pytest.fixture
def performances_file(event_dir, sample_performances):
    """Create performances.json file with sample data"""
    performances_file = event_dir / 'performances.json'
    with open(performances_file, 'w') as f:
        json.dump(sample_performances, f, indent=2)
    return performances_file


@pytest.fixture
def breaks_file(event_dir, sample_breaks):
    """Create breaks.json file with sample data"""
    breaks_file = event_dir / 'breaks.json'
    with open(breaks_file, 'w') as f:
        json.dump(sample_breaks, f, indent=2)
    return breaks_file


@pytest.fixture
def mock_event_manager_methods(event_manager, event_dir):
    """Helper to create mock implementations of EventManager methods for testing"""

    def load_performances():
        performances_file = event_dir / 'performances.json'
        if performances_file.exists():
            with open(performances_file, 'r') as f:
                return json.load(f)
        return []

    def save_performances(performances):
        performances_file = event_dir / 'performances.json'
        with file_lock(performances_file):
            with open(performances_file, 'w') as f:
                json.dump(performances, f, indent=2)

    def reorder_performances(order):
        performances = load_performances()
        performance_map = {p['id']: p for p in performances}

        # Update order ONLY for performances in the reorder list
        for i, perf_id in enumerate(order):
            if perf_id in performance_map:
                performance_map[perf_id]['order'] = i

        # Keep ALL performances
        all_performances = list(performance_map.values())
        save_performances(all_performances)
        return True

    def load_breaks():
        breaks_file = event_dir / 'breaks.json'
        if breaks_file.exists():
            with open(breaks_file, 'r') as f:
                return json.load(f)
        return []

    def save_breaks(breaks):
        breaks_file = event_dir / 'breaks.json'
        with file_lock(breaks_file):
            with open(breaks_file, 'w') as f:
                json.dump(breaks, f, indent=2)

    def reorder_breaks(order):
        breaks = load_breaks()
        break_map = {b['id']: b for b in breaks}

        # Update order ONLY for breaks in the reorder list
        for i, break_id in enumerate(order):
            if break_id in break_map:
                break_map[break_id]['order'] = i

        # Keep ALL breaks
        all_breaks = list(break_map.values())
        save_breaks(all_breaks)
        return True

    return {
        'load_performances': load_performances,
        'save_performances': save_performances,
        'reorder_performances': reorder_performances,
        'load_breaks': load_breaks,
        'save_breaks': save_breaks,
        'reorder_breaks': reorder_breaks,
    }
