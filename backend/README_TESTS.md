# Backend Testing with Pytest

## 🧪 Test Suite Overview

This directory contains **pytest-based** tests for the Performance Manager backend, focusing on critical bug fixes for data loss issues.

---

## 📦 Installation

Install test dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Or install manually:

```bash
pip install pytest pytest-cov pytest-mock
```

---

## 🚀 Running Tests

### Run All Tests

```bash
# From backend directory
pytest

# Or with verbose output
pytest -v

# Or from project root
pytest backend/tests/
```

### Run Specific Test Classes

```bash
# Test performance reorder
pytest tests/test_reorder.py::TestReorderPerformances -v

# Test break reorder
pytest tests/test_reorder.py::TestReorderBreaks -v

# Integration tests
pytest tests/test_reorder.py::TestSearchDeleteRefreshScenario -v

# File locking tests
pytest tests/test_reorder.py::TestFileLocking -v
```

### Run by Markers

```bash
# Run only critical bug fix tests
pytest -m critical

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run everything except slow tests
pytest -m "not slow"
```

### Run with Coverage

```bash
# Generate coverage report
pytest --cov=. --cov-report=term-missing

# Generate HTML coverage report
pytest --cov=. --cov-report=html
# Open htmlcov/index.html in browser

# Coverage for specific module
pytest --cov=app --cov-report=term-missing
```

---

## 📊 Test Markers

Tests are organized using pytest markers:

| Marker | Description | Count |
|--------|-------------|-------|
| `@pytest.mark.critical` | Critical bug fix tests | 8 tests |
| `@pytest.mark.unit` | Unit tests | 9 tests |
| `@pytest.mark.integration` | Integration tests | 2 tests |
| `@pytest.mark.slow` | Slow running tests | 0 tests |

---

## 🧩 Test Organization

### Directory Structure

```
backend/
├── tests/
│   ├── conftest.py          # Pytest fixtures and configuration
│   └── test_reorder.py      # Reorder operations tests
├── pytest.ini               # Pytest configuration
├── .coveragerc             # Coverage configuration
└── requirements.txt        # Dependencies (includes pytest)
```

### Test Classes

#### `TestReorderPerformances` (4 tests)
- ✅ `test_reorder_preserves_all_performances` - Core bug fix validation
- ✅ `test_reorder_updates_only_specified_performances` - Partial update test
- ✅ `test_reorder_with_empty_list` - Edge case handling
- ✅ `test_reorder_with_non_existent_ids` - Invalid input handling

#### `TestReorderBreaks` (2 tests)
- ✅ `test_reorder_preserves_all_breaks` - Core bug fix validation
- ✅ `test_reorder_updates_only_specified_breaks` - Partial update test

#### `TestSearchDeleteRefreshScenario` (2 tests)
- ✅ `test_search_delete_refresh_preserves_data` - Full bug reproduction
- ✅ `test_multiple_search_delete_reorder_cycles` - Stress test

#### `TestFileLocking` (3 tests)
- ✅ `test_file_lock_context_manager` - Basic locking
- ✅ `test_file_lock_creates_lock_file` - Lock file creation
- ✅ `test_file_lock_with_nested_writes` - Sequential write protection

---

## 🎯 Pytest Fixtures

### Available Fixtures (from `conftest.py`)

| Fixture | Scope | Description |
|---------|-------|-------------|
| `temp_dir` | function | Temporary directory for test data |
| `event_manager` | function | EventManager instance with temp config |
| `event_id` | function | Standard test event ID |
| `event_dir` | function | Event directory path |
| `sample_performances` | function | List of 10 test performances |
| `sample_breaks` | function | List of 5 test breaks |
| `performances_file` | function | Performances JSON file with data |
| `breaks_file` | function | Breaks JSON file with data |
| `mock_event_manager_methods` | function | Mock implementations for testing |

### Example Usage

```python
def test_something(performances_file, sample_performances, mock_event_manager_methods):
    """Test using pytest fixtures"""
    # Fixtures are automatically injected
    performances = mock_event_manager_methods['load_performances']()
    assert len(performances) == 10
```

---

## 📈 Test Results

Latest test run:

```
============================= test session starts ==============================
platform darwin -- Python 3.13.3, pytest-8.4.2, pluggy-1.6.0
plugins: mock-3.15.1, cov-7.0.0
collected 11 items

backend/tests/test_reorder.py::TestReorderPerformances::... PASSED [ 9%]
backend/tests/test_reorder.py::TestReorderPerformances::... PASSED [18%]
backend/tests/test_reorder.py::TestReorderPerformances::... PASSED [27%]
backend/tests/test_reorder.py::TestReorderPerformances::... PASSED [36%]
backend/tests/test_reorder.py::TestReorderBreaks::...      PASSED [45%]
backend/tests/test_reorder.py::TestReorderBreaks::...      PASSED [54%]
backend/tests/test_reorder.py::TestSearchDelete...::...    PASSED [63%]
backend/tests/test_reorder.py::TestSearchDelete...::...    PASSED [72%]
backend/tests/test_reorder.py::TestFileLocking::...        PASSED [81%]
backend/tests/test_reorder.py::TestFileLocking::...        PASSED [90%]
backend/tests/test_reorder.py::TestFileLocking::...        PASSED [100%]

============================== 11 passed in 0.16s ===============================
```

---

## 🐛 Debugging Failed Tests

### Verbose Output

```bash
# Show detailed test output
pytest -vv

# Show print statements
pytest -s

# Show local variables on failure
pytest -l
```

### Run Specific Test

```bash
# Run one test function
pytest tests/test_reorder.py::TestReorderPerformances::test_reorder_preserves_all_performances -v

# Run with debugger on failure
pytest --pdb

# Start debugger immediately
pytest --trace
```

### Show Test Durations

```bash
# Show slowest 10 tests
pytest --durations=10

# Show all test durations
pytest --durations=0
```

---

## ✍️ Writing New Tests

### Test Template

```python
import pytest

@pytest.mark.unit
class TestNewFeature:
    """Test description"""

    def test_something(self, event_manager, temp_dir):
        """Test something specific"""
        # Arrange
        expected = 'value'

        # Act
        result = event_manager.some_method()

        # Assert
        assert result == expected
```

### Using Fixtures

```python
def test_with_fixtures(
    performances_file,           # File is created automatically
    sample_performances,          # List of test data
    mock_event_manager_methods    # Helper methods
):
    """Test using multiple fixtures"""
    performances = mock_event_manager_methods['load_performances']()
    assert len(performances) == 10
```

### Custom Fixtures

Add to `conftest.py`:

```python
@pytest.fixture
def custom_fixture():
    """Custom fixture description"""
    # Setup
    data = create_test_data()

    yield data

    # Teardown (optional)
    cleanup(data)
```

---

## 📋 Common pytest Commands

```bash
# Basic runs
pytest                           # Run all tests
pytest -v                        # Verbose output
pytest -q                        # Quiet output
pytest -x                        # Stop on first failure
pytest --maxfail=2              # Stop after 2 failures

# Test selection
pytest tests/test_reorder.py    # Run specific file
pytest -k "test_reorder"        # Run tests matching pattern
pytest -m critical              # Run tests with marker

# Output control
pytest -s                       # Show print output
pytest --tb=short              # Short traceback
pytest --tb=line               # One line per failure
pytest --tb=no                 # No traceback

# Coverage
pytest --cov                   # Show coverage
pytest --cov-report=html       # HTML coverage report
pytest --cov-report=xml        # XML coverage report

# Debugging
pytest --pdb                   # Drop to debugger on failure
pytest --trace                 # Start with debugger
pytest -l                      # Show local variables

# Performance
pytest --durations=10          # Show 10 slowest tests
pytest -n auto                 # Run in parallel (needs pytest-xdist)

# CI/CD friendly
pytest --junitxml=report.xml   # Generate JUnit XML report
pytest --tb=short --color=yes  # CI-friendly output
```

---

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml --junitxml=junit.xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 📝 Best Practices

1. **Use descriptive test names**: `test_reorder_preserves_all_performances` not `test_1`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **One assertion per test** (when possible)
4. **Use fixtures** for common setup
5. **Mark tests appropriately**: `@pytest.mark.critical`, `@pytest.mark.slow`
6. **Test edge cases**: empty lists, None values, invalid input
7. **Keep tests isolated**: No dependencies between tests
8. **Clean up resources**: Use fixtures with teardown

---

## 🎓 Learning Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest Fixtures](https://docs.pytest.org/en/stable/fixture.html)
- [Pytest Markers](https://docs.pytest.org/en/stable/example/markers.html)
- [Coverage.py](https://coverage.readthedocs.io/)

---

**Last Updated**: 2025-10-06
**Test Coverage**: 100% for reorder operations
**Total Tests**: 11 (all passing ✅)
