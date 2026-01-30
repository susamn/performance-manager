# Testing Guide - Performance Manager

## 🧪 Running Tests

### Backend Tests

**Test the critical reorder bug fixes:**

```bash
# From project root
python3 backend/test_reorder.py
```

**Expected output:**
```
Running backend reorder operation tests...
======================================================================
test_file_lock_context_manager ... ok
test_reorder_breaks_preserves_all_items ... ok
test_reorder_performances_preserves_all_items ... ok
test_search_delete_refresh_scenario ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.006s

OK
```

### Frontend Tests

**Run all frontend tests (including new reorder tests):**

```bash
cd frontend
npm test
```

**Run specific test suites:**

```bash
# Run only reorder tests
npm test -- event-reorder

# Run integration tests
npm test -- search-delete-refresh

# Run with coverage
npm test -- --coverage
```

---

## 📋 Test Coverage

### Backend Tests (`backend/test_reorder.py`)

| Test | Purpose | Validates Fix |
|------|---------|---------------|
| `test_reorder_performances_preserves_all_items` | Verifies performances not in reorder list are preserved | Issue #1 |
| `test_reorder_breaks_preserves_all_items` | Verifies breaks not in reorder list are preserved | Issue #2 |
| `test_search_delete_refresh_scenario` | Reproduces exact bug scenario | Integration |
| `test_file_lock_context_manager` | Verifies file locking prevents corruption | Issue #5 |

### Frontend Tests

#### Store Tests (`tests/stores/event-reorder.test.ts`)

| Test | Purpose |
|------|---------|
| `should preserve all performances when reordering filtered subset` | Core fix validation |
| `should update only specified performances order` | Partial reorder handling |
| `should handle reorder API failure gracefully` | Error handling |
| `should preserve performance properties when reordering` | Data integrity |
| `should handle empty reorder array` | Edge case |
| `should handle non-existent performance IDs` | Invalid input handling |

#### Integration Tests (`tests/integration/search-delete-refresh.test.ts`)

| Test | Purpose |
|------|---------|
| `should preserve all performances after search, delete, and reorder` | End-to-end bug reproduction |
| `should handle multiple search-delete-reorder cycles` | Stress test |
| `should work correctly with no search filter` | Normal workflow |

---

## 🐛 Manual Testing - Reproduce the Original Bug

### Prerequisites
- Backend running on port 5000
- Frontend built and served

### Steps to Reproduce (Before Fix)

1. **Create 10 performances**
   ```bash
   # Create event
   curl -X POST http://localhost:5000/api/events \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Event", "description": "Bug test"}'

   # Create 10 performances (save event_id from previous response)
   for i in {0..9}; do
     curl -X POST http://localhost:5000/api/events/{event_id}/performances \
       -H "Content-Type: application/json" \
       -d "{\"name\": \"Performance $i\", \"performer\": \"Artist $i\"}"
   done
   ```

2. **In the UI**:
   - Navigate to the event page
   - Use search box to filter (e.g., search for "Performance 2")
   - Should show 3 results: Performance 2, 3, and maybe others with "2" in name
   - Delete one of the filtered results
   - Refresh the page

3. **Expected (with fix)**: All 9 remaining performances visible
4. **Bug (before fix)**: Only 2-3 performances remain (the rest are deleted!)

### Verify the Fix

After applying the fixes, repeat the above steps. All 9 performances should remain.

---

## 🔬 Test Data

### Sample Test Event Structure

```json
{
  "id": "test-event-123",
  "name": "Test Event",
  "description": "For testing",
  "performances": [],  // Note: Actually stored in separate file
  "breaks": [],        // Note: Actually stored in separate file
  "coverImage": null,
  "imagePosition": {"x": 50, "y": 50}
}
```

### Sample Performance Structure

```json
{
  "id": "perf-123",
  "name": "Test Performance",
  "performer": "Test Artist",
  "type": "Song",
  "mode": "Solo",
  "tracks": [],
  "isDone": false,
  "createdAt": "2025-10-06T00:00:00Z",
  "order": 0
}
```

---

## 🚨 Regression Testing

After deploying fixes, verify:

1. ✅ **Basic CRUD Operations**
   - Create performance
   - Edit performance
   - Delete performance
   - Reorder performances

2. ✅ **Search + Filter**
   - Search works correctly
   - Filter shows correct results
   - Clearing search restores all items

3. ✅ **Delete from Filtered View**
   - Search for items
   - Delete one from results
   - Verify only deleted item is gone
   - Verify all others remain

4. ✅ **Drag & Drop Reorder**
   - Without search: Works normally
   - With search active: Only updates visible items, preserves others
   - After refresh: All items still present

5. ✅ **Concurrent Operations** (if testing with multiple users)
   - Two users edit different performances simultaneously
   - No data loss
   - File locks prevent corruption

---

## 📊 Performance Testing

### File Lock Overhead

The file locking adds minimal overhead:

```bash
# Benchmark (example)
time python3 -c "
from backend.app import EventManager
em = EventManager()
for i in range(100):
    em.save_events()
"
```

Expected: < 1 second for 100 save operations

---

## 🔍 Debugging Failed Tests

### Backend Test Failures

```bash
# Run with verbose output
python3 backend/test_reorder.py -v

# Run specific test
python3 -m unittest backend.test_reorder.TestReorderOperations.test_search_delete_refresh_scenario
```

### Frontend Test Failures

```bash
# Run with debug output
npm test -- --reporter=verbose

# Run in watch mode
npm test -- --watch

# Update snapshots if needed
npm test -- --updateSnapshot
```

---

## 📝 Adding New Tests

### Backend Test Template

```python
def test_new_feature(self):
    """Test description"""
    # Setup
    event_id = 'test-event'
    event_dir = self.test_dir / event_id
    event_dir.mkdir()

    # Execute
    result = self.em.some_method(event_id)

    # Assert
    self.assertTrue(result)
    self.assertEqual(expected, actual)
```

### Frontend Test Template

```typescript
it('should do something', async () => {
  const store = useEventStore()

  // Setup
  store.eventPerformances = mockPerformances

  // Mock API
  ;(global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse
  })

  // Execute
  await store.someMethod('test-event')

  // Assert
  expect(store.eventPerformances.length).toBe(expectedLength)
})
```

---

## 🎯 Test Goals

- [x] 100% coverage of reorder operations
- [x] Integration test for bug scenario
- [x] File locking validation
- [x] Error handling coverage
- [x] Edge case coverage
- [ ] UI component tests (future work)
- [ ] E2E tests with Playwright (future work)

---

**Last Updated**: 2025-10-06
