# Performance Manager - Recent Changes

## Summary of Implemented Features

### 1. Merged Break and Performance Forms
- **Changed**: `AddPerformanceForm.vue` now includes "Break" as a performance type
- **Removed**: `AddBreakForm.vue` component (no longer needed)
- **Benefit**: Single unified interface for creating all event items
- **UI Changes**:
  - Type dropdown now includes "Break" option
  - When "Break" is selected, performer field is hidden
  - Break sub-type selector appears (Lunch, Dinner, Broadcast, etc.)
  - Audio file upload is hidden for Break types

### 2. Backend Integration
- **Updated**: Backend already supported flexible type/mode fields
- **Break Storage**: Breaks are now stored as performances with `type='Break'` and `mode` containing the break sub-type
- **Data Structure**: Unified data model - all items are performances, some just happen to be breaks

### 3. Completed Section
- **New Feature**: Automatic separation of active vs completed items
- **Behavior**:
  - When a card is marked as done, it moves to the "Completed" section
  - When unmarked (clicking the mark done button again), it moves back to the **top** of "Performances" section
  - Completed items are visually distinct (70% opacity, 85% on hover) but fully interactive
  - All buttons work in completed section: toggle done, edit, delete
  - No longer moves selected items to top of list

### 4. Improved Drag and Drop
- **Enhanced**: Better interactive feedback during drag operations
- **Features**:
  - Uses SortableJS with improved configuration
  - `swapThreshold: 0.65` for better insertion feel
  - `forceFallback: true` for consistent behavior across browsers
  - Maintains order integrity when dragging
  - Editing a card does not affect arrangement
  - Deleting a card does not mess up other cards' order

### 5. Visual Distinction for Breaks
- **Added**: Special styling for Break-type performances
  - Blue gradient background with dashed border
  - Uses same BreakCard component for rendering
  - Distinct from regular performance cards

### 6. Test Coverage
- **Created**: Comprehensive test suite (`PerformanceArrangement.spec.ts`)
- **Coverage**: 15 tests covering:
  - Order management during creation, drag, edit, and delete
  - Completed section behavior
  - Break type performance handling
  - Search functionality maintaining order
  - Edge cases in drag and drop

## Files Modified

### Frontend
1. **src/components/AddPerformanceForm.vue**
   - Added Break type support
   - Conditional form fields based on type
   - Updated submission logic

2. **src/views/EventView.vue**
   - Removed AddBreakForm import
   - Unified item handling (no separate breaks array)
   - Added active/completed section separation
   - Improved sortable configuration
   - Removed selection-to-top behavior

3. **src/components/PerformanceCard.vue**
   - Added break-type CSS class
   - Special styling for Break performances

4. **src/types/index.ts**
   - Extended Performance type to include 'Break'
   - Extended mode to include break sub-types

5. **tests/setup.ts** (NEW)
   - Test environment configuration

6. **vitest.config.ts**
   - Fixed setup file path

7. **src/components/__tests__/PerformanceArrangement.spec.ts** (NEW)
   - Comprehensive test suite for arrangement functionality

### Backend
- No changes required (already flexible enough to handle the new data model)

## Migration Notes

### For Existing Data
- Existing "Break" items stored separately will need to be migrated
- Migration would involve:
  1. Reading existing breaks from `breaks.json`
  2. Converting to performances with `type='Break'`
  3. Adding to `performances.json` with proper order values
  4. Deleting old `breaks.json` files

### API Compatibility
- All existing performance endpoints work as-is
- Break-specific endpoints (`/api/events/<id>/breaks`) are no longer used by frontend
- Backend can keep these endpoints for backward compatibility

## Testing

Run the test suite:
```bash
cd frontend
npm test
```

All 15 tests should pass, covering:
- ✅ Order maintenance during CRUD operations
- ✅ Drag and drop reordering
- ✅ Completed section behavior
- ✅ Break type handling
- ✅ Search functionality
- ✅ Edge cases

## User Experience Improvements

1. **Simplified Workflow**: One form for all event items
2. **Better Organization**: Clear separation of active vs completed items
3. **Improved Drag UX**: More responsive and predictable drag behavior
4. **Visual Clarity**: Breaks are visually distinct but follow same interaction patterns
5. **Maintained Order**: Editing or deleting items doesn't disrupt arrangement
6. **Smart Completion**: Marking items as done automatically organizes them

## Future Enhancements

Potential improvements for consideration:
- Drag between Active and Completed sections to toggle done status
- Bulk operations (mark multiple as done, delete selected)
- Undo functionality for accidental changes
- Keyboard shortcuts for navigation and quick actions
- Export/import functionality for event schedules
