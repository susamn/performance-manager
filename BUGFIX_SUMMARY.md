# Critical Bug Fixes - Performance Manager

## 🚨 Summary of Fatal Flaws Fixed

This document summarizes the critical data loss bugs discovered and fixed in the Performance Manager application.

---

## Issue #1: **Performance Reorder Data Loss** (CRITICAL)

### **The Bug**
When users searched for performances, deleted one, and refreshed the page, **ALL non-visible performances were permanently deleted**.

### **Example Scenario**
1. User has 10 performances
2. User searches and finds 3 matching performances
3. User deletes 1 of the 3 (9 total remain)
4. User refreshes page
5. **BUG**: Only 2 performances remain (7 were silently deleted!)

### **Root Cause**
**Backend** (`app.py:224-240`):
```python
# BEFORE (BROKEN):
reordered = []
for i, perf_id in enumerate(order):
    if perf_id in performance_map:
        reordered.append(performance)  # Only adds filtered items
self.save_event_performances(event_id, reordered)  # DELETES everything else!
```

**Frontend** (`event.ts:151-169`):
```typescript
// BEFORE (BROKEN):
const filteredPerformances = newOrder
  .map(id => performanceMap.get(id))
  .filter(Boolean) as Performance[]
eventPerformances.value = reorderedPerformances  // DELETES everything else!
```

### **The Fix**

**Backend**:
```python
# AFTER (FIXED):
performance_map = {p['id']: p for p in performances}

# Update order ONLY for performances in the reorder list
for i, perf_id in enumerate(order):
    if perf_id in performance_map:
        performance_map[perf_id]['order'] = i

# Keep ALL performances, not just reordered ones
all_performances = list(performance_map.values())
self.save_event_performances(event_id, all_performances)
```

**Frontend**:
```typescript
// AFTER (FIXED):
const performanceMap = new Map(eventPerformances.value.map(p => [p.id, p]))

newOrder.forEach((id, index) => {
  const perf = performanceMap.get(id)
  if (perf) {
    perf.order = index
  }
})

// Keep ALL performances
eventPerformances.value = Array.from(performanceMap.values())
```

**Files Modified**:
- `backend/app.py:224-247`
- `frontend/src/stores/event.ts:151-177`

---

## Issue #2: **Break Reorder Data Loss** (CRITICAL)

### **The Bug**
Identical issue as #1, but for breaks instead of performances.

### **Root Cause**
**Backend** (`app.py:886-919`):
```python
# BEFORE (BROKEN):
reordered_breaks = []
for index, break_id in enumerate(new_order):
    if break_id in break_map:
        reordered_breaks.append(break_obj)  # Only adds filtered items
em.save_event_breaks(event_id, reordered_breaks)  # DELETES everything else!
```

### **The Fix**
```python
# AFTER (FIXED):
break_map = {b['id']: b for b in breaks}

# Update order ONLY for breaks in the reorder list
for index, break_id in enumerate(new_order):
    if break_id in break_map:
        break_map[break_id]['order'] = index

# Keep ALL breaks
all_breaks = list(break_map.values())
em.save_event_breaks(event_id, all_breaks)
```

**Files Modified**:
- `backend/app.py:908-925`

---

## Issue #3: **Race Condition in onPerformanceCreated**

### **The Bug**
When creating a new performance, the frontend would:
1. Create performance (backend assigns `order: len(performances)`)
2. Immediately update order to `maxOrder + 1`
3. Reload all performances

If another user created a performance between steps 1 and 3, order values would collide.

### **The Fix**
Backend already assigns correct order, so frontend should just reload:

```typescript
// BEFORE (BROKEN):
async function onPerformanceCreated(performance: Performance) {
  const maxOrder = Math.max(...allItems.map(item => item.order), -1)
  await fetch(`/api/events/${eventId}/performances/${performance.id}`, {
    method: 'PUT',
    body: JSON.stringify({ order: maxOrder + 1 })  // Race condition!
  })
  await eventStore.loadEventPerformances(eventId)
}

// AFTER (FIXED):
async function onPerformanceCreated(performance: Performance) {
  // Backend already assigns correct order
  await eventStore.loadEventPerformances(eventId)
}
```

**Files Modified**:
- `frontend/src/views/EventView.vue:1033-1038`

---

## Issue #4: **Inconsistent API Response**

### **The Bug**
`GET /api/events` returned events with `performanceCount`, but `GET /api/events/{id}` didn't.

### **The Fix**
Added performance count to single event endpoint:

```python
@app.route('/api/events/<event_id>', methods=['GET'])
def get_event(event_id: str):
    event = em.get_event(event_id)
    if event:
        event_with_count = event.copy()
        # Calculate performance count
        performances_file = em.get_event_performances_file(event['id'])
        if performances_file.exists():
            with open(performances_file, 'r') as f:
                event_performances = json.load(f)
            event_with_count['performanceCount'] = len(event_performances)
        else:
            event_with_count['performanceCount'] = 0
        return jsonify(event_with_count)
```

**Files Modified**:
- `backend/app.py:460-478`

---

## Issue #5: **No Concurrent Write Protection**

### **The Bug**
Multiple simultaneous writes to JSON files could corrupt data (last write wins).

### **The Fix**
Added file locking using `fcntl`:

```python
import fcntl
from contextlib import contextmanager

@contextmanager
def file_lock(file_path: Path):
    """Context manager for file locking to prevent concurrent writes"""
    lock_file = file_path.parent / f".{file_path.name}.lock"
    lock_file.touch(exist_ok=True)

    with open(lock_file, 'w') as lock:
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            yield
        finally:
            fcntl.flock(lock.fileno(), fcntl.LOCK_UN)

# Usage:
def save_event_performances(self, event_id: str, performances: List[Dict[str, Any]]):
    performances_file = self.get_event_performances_file(event_id)
    with file_lock(performances_file):
        with open(performances_file, 'w') as f:
            json.dump(performances, f, indent=2)
```

**Files Modified**:
- `backend/app.py:32-45` (added file_lock)
- `backend/app.py:64-68` (save_events)
- `backend/app.py:141-146` (save_event_performances)
- `backend/app.py:296-301` (save_event_breaks)

---

## 🧪 Tests Added

### Backend Tests
**File**: `backend/test_reorder.py`

- ✅ `test_reorder_performances_preserves_all_items` - Verifies fix for Issue #1
- ✅ `test_reorder_breaks_preserves_all_items` - Verifies fix for Issue #2
- ✅ `test_search_delete_refresh_scenario` - Integration test reproducing exact bug
- ✅ `test_file_lock_context_manager` - Verifies file locking works

**Run Tests**:
```bash
python3 backend/test_reorder.py
```

### Frontend Tests
**File**: `tests/stores/event-reorder.test.ts`

- ✅ `should preserve all performances when reordering filtered subset`
- ✅ `should update only specified performances order`
- ✅ `should handle reorder API failure gracefully`
- ✅ `should preserve performance properties when reordering`
- ✅ `should handle empty reorder array`
- ✅ `should handle non-existent performance IDs in reorder array`

**File**: `tests/integration/search-delete-refresh.test.ts`

- ✅ `should preserve all performances after search, delete, and reorder`
- ✅ `should handle multiple search-delete-reorder cycles`
- ✅ `should work correctly with no search filter (all items visible)`

**Run Tests**:
```bash
cd frontend
npm test
```

---

## 📊 Impact Assessment

### **Severity**: CRITICAL
- **Data Loss**: Yes - permanent deletion of performances/breaks
- **User Impact**: Any user who searched, deleted, and refreshed would lose data
- **Frequency**: Reproducible 100% of the time with the specific workflow

### **Affected Versions**
All versions prior to this fix.

### **Backwards Compatibility**
✅ All fixes are backwards compatible. No breaking changes to API or data structures.

---

## ✅ Verification Checklist

- [x] Backend reorder functions preserve all items
- [x] Frontend store preserves all items
- [x] Race condition in onPerformanceCreated eliminated
- [x] API responses consistent (performanceCount)
- [x] File locking prevents concurrent write corruption
- [x] Backend tests pass (4/4)
- [x] Frontend tests created (9 tests)
- [x] Integration test reproduces and validates fix
- [x] No breaking changes introduced

---

## 🔍 Other Issues Identified (Not Yet Fixed)

### Issue #6: Event Architecture - Misleading Empty Arrays
The `events.json` contains `performances: []` and `breaks: []` fields that are never populated. The actual data is in separate files. This is confusing and could lead to bugs.

**Status**: Documented, not fixed (architectural issue, lower priority)

---

## 📝 Recommendations

1. **Run Tests Regularly**: Add tests to CI/CD pipeline
2. **Monitor Logs**: File locking adds `.lock` files - monitor for stale locks
3. **Consider Database**: JSON file storage has limitations - consider SQLite or PostgreSQL for production
4. **Add Audit Logging**: Track all delete/reorder operations for debugging
5. **Add Data Backup**: Implement periodic backups of config directory

---

## 👥 Credits

**Bug Reporter**: User (via search+delete+refresh scenario)
**Bug Analysis**: Deep code investigation
**Fixes Implemented**: All 5 critical issues
**Tests Created**: 13 comprehensive tests

---

**Date**: 2025-10-06
**Version**: Fixed in current codebase
**Priority**: CRITICAL - Deploy immediately
