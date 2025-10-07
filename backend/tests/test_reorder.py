"""
Backend tests for reorder operations and data integrity using pytest
Tests specifically for the fatal flaws fixed in reorder_performances and reorder_event_breaks
"""

import pytest
import json
from pathlib import Path


@pytest.mark.critical
@pytest.mark.unit
class TestReorderPerformances:
    """Test reorder operations to ensure no data loss"""

    def test_reorder_preserves_all_performances(
        self,
        performances_file,
        sample_performances,
        mock_event_manager_methods
    ):
        """
        CRITICAL TEST: Ensure reorder_performances preserves performances not in reorder list
        This tests the fix for the fatal flaw where filtering + reorder would delete data
        """
        # Initial state: 10 performances exist
        performances = mock_event_manager_methods['load_performances']()
        assert len(performances) == 10

        # Simulate filtered reorder: only reorder 2 items (like after search)
        # This simulates: search returns 3 items, delete 1, then refresh triggers reorder
        filtered_ids = ['perf-2', 'perf-5']

        # Execute reorder
        result = mock_event_manager_methods['reorder_performances'](filtered_ids)
        assert result is True

        # Load performances and verify ALL 10 are still there
        saved_performances = mock_event_manager_methods['load_performances']()
        assert len(saved_performances) == 10, "All 10 performances should be preserved"

        # Verify the reordered items have correct order
        perf_map = {p['id']: p for p in saved_performances}
        assert perf_map['perf-2']['order'] == 0
        assert perf_map['perf-5']['order'] == 1

        # Verify other items kept their original order
        assert perf_map['perf-0']['order'] == 0
        assert perf_map['perf-1']['order'] == 1
        assert perf_map['perf-9']['order'] == 9

    def test_reorder_updates_only_specified_performances(
        self,
        performances_file,
        mock_event_manager_methods
    ):
        """Verify only specified performances have their order updated"""
        # Reorder only perf-1 and perf-3
        result = mock_event_manager_methods['reorder_performances'](['perf-1', 'perf-3'])
        assert result is True

        performances = mock_event_manager_methods['load_performances']()
        perf_map = {p['id']: p for p in performances}

        # perf-1 and perf-3 should have new order
        assert perf_map['perf-1']['order'] == 0
        assert perf_map['perf-3']['order'] == 1

        # perf-2 should keep original order
        assert perf_map['perf-2']['order'] == 2

    def test_reorder_with_empty_list(
        self,
        performances_file,
        mock_event_manager_methods
    ):
        """Test reorder with empty list preserves all performances"""
        result = mock_event_manager_methods['reorder_performances']([])
        assert result is True

        performances = mock_event_manager_methods['load_performances']()
        assert len(performances) == 10

    def test_reorder_with_non_existent_ids(
        self,
        performances_file,
        mock_event_manager_methods
    ):
        """Test reorder gracefully handles non-existent performance IDs"""
        # Include non-existent ID
        result = mock_event_manager_methods['reorder_performances'](
            ['perf-999', 'perf-1', 'perf-2']
        )
        assert result is True

        performances = mock_event_manager_methods['load_performances']()
        assert len(performances) == 10  # All original performances still exist

        perf_map = {p['id']: p for p in performances}
        # perf-1 and perf-2 should have updated order
        assert perf_map['perf-1']['order'] == 1
        assert perf_map['perf-2']['order'] == 2


@pytest.mark.critical
@pytest.mark.unit
class TestReorderBreaks:
    """Test break reorder operations"""

    def test_reorder_preserves_all_breaks(
        self,
        breaks_file,
        sample_breaks,
        mock_event_manager_methods
    ):
        """
        CRITICAL TEST: Ensure reorder_breaks preserves breaks not in reorder list
        Same fatal flaw as performances
        """
        # Initial state: 5 breaks exist
        breaks = mock_event_manager_methods['load_breaks']()
        assert len(breaks) == 5

        # Simulate filtered reorder: only reorder 2 breaks
        filtered_ids = ['break-1', 'break-3']

        # Execute reorder
        result = mock_event_manager_methods['reorder_breaks'](filtered_ids)
        assert result is True

        # Load breaks and verify ALL 5 are still there
        saved_breaks = mock_event_manager_methods['load_breaks']()
        assert len(saved_breaks) == 5, "All 5 breaks should be preserved"

        # Verify the reordered items have correct order
        break_map = {b['id']: b for b in saved_breaks}
        assert break_map['break-1']['order'] == 0
        assert break_map['break-3']['order'] == 1

    def test_reorder_updates_only_specified_breaks(
        self,
        breaks_file,
        mock_event_manager_methods
    ):
        """Verify only specified breaks have their order updated"""
        result = mock_event_manager_methods['reorder_breaks'](['break-0', 'break-4'])
        assert result is True

        breaks = mock_event_manager_methods['load_breaks']()
        break_map = {b['id']: b for b in breaks}

        # Reordered breaks
        assert break_map['break-0']['order'] == 0
        assert break_map['break-4']['order'] == 1

        # Non-reordered breaks keep original order
        assert break_map['break-1']['order'] == 1
        assert break_map['break-2']['order'] == 2
        assert break_map['break-3']['order'] == 3


@pytest.mark.critical
@pytest.mark.integration
class TestSearchDeleteRefreshScenario:
    """Integration test reproducing the exact bug scenario"""

    def test_search_delete_refresh_preserves_data(
        self,
        event_dir,
        sample_performances,
        mock_event_manager_methods
    ):
        """
        INTEGRATION TEST: Reproduce the exact bug scenario
        1. Create 10 performances
        2. Search (filter to 3 results: perf-2, perf-5, perf-7)
        3. Delete 1 (perf-5, now 2 filtered, 9 total)
        4. Refresh triggers reorder with only 2 IDs
        5. Verify all 9 remain
        """
        # Step 1: Initial state - 10 performances
        performances_file = event_dir / 'performances.json'
        with open(performances_file, 'w') as f:
            json.dump(sample_performances, f)

        performances = mock_event_manager_methods['load_performances']()
        assert len(performances) == 10

        # Step 2: Simulate search filter - "Special" performances
        # Would return perf-2, perf-5, perf-7 (based on sample_performances fixture)
        search_results = [p for p in performances if 'Special' in p['name']]
        assert len(search_results) == 3
        search_result_ids = [p['id'] for p in search_results]
        assert search_result_ids == ['perf-2', 'perf-5', 'perf-7']

        # Step 3: Delete one of the search results (perf-5)
        performances = [p for p in performances if p['id'] != 'perf-5']
        mock_event_manager_methods['save_performances'](performances)

        # Verify deletion
        performances = mock_event_manager_methods['load_performances']()
        assert len(performances) == 9

        # Now only 2 items match search: perf-2, perf-7
        remaining_search = [p for p in performances if 'Special' in p['name']]
        assert len(remaining_search) == 2

        # Step 4: Refresh triggers reorder with only visible (filtered) IDs
        visible_ids = [p['id'] for p in remaining_search]  # ['perf-2', 'perf-7']
        assert visible_ids == ['perf-2', 'perf-7']

        # This should NOT delete the other 7 performances
        result = mock_event_manager_methods['reorder_performances'](visible_ids)
        assert result is True

        # Step 5: CRITICAL VERIFICATION - All 9 should still exist
        final_performances = mock_event_manager_methods['load_performances']()
        assert len(final_performances) == 9, \
            "Bug reproduced: Should have 9 performances, not just the 2 filtered ones"

        # Verify deleted item is gone
        final_ids = [p['id'] for p in final_performances]
        assert 'perf-5' not in final_ids

        # Verify all other items are present
        for i in range(10):
            if i != 5:  # Skip the deleted one
                assert f'perf-{i}' in final_ids, \
                    f'Performance perf-{i} should still exist'

        # Verify reordered items have updated order
        perf_map = {p['id']: p for p in final_performances}
        assert perf_map['perf-2']['order'] == 0
        assert perf_map['perf-7']['order'] == 1

        # Verify non-reordered items kept their original order
        assert perf_map['perf-0']['order'] == 0
        assert perf_map['perf-9']['order'] == 9

    def test_multiple_search_delete_reorder_cycles(
        self,
        event_dir,
        sample_performances,
        mock_event_manager_methods
    ):
        """Test multiple cycles of search, delete, and reorder"""
        # Initialize
        performances_file = event_dir / 'performances.json'
        with open(performances_file, 'w') as f:
            json.dump(sample_performances, f)

        # Cycle 1: Delete perf-3, reorder partial list
        performances = mock_event_manager_methods['load_performances']()
        performances = [p for p in performances if p['id'] != 'perf-3']
        mock_event_manager_methods['save_performances'](performances)
        mock_event_manager_methods['reorder_performances'](['perf-1', 'perf-4'])
        assert len(mock_event_manager_methods['load_performances']()) == 9

        # Cycle 2: Delete perf-6, reorder different partial list
        performances = mock_event_manager_methods['load_performances']()
        performances = [p for p in performances if p['id'] != 'perf-6']
        mock_event_manager_methods['save_performances'](performances)
        mock_event_manager_methods['reorder_performances'](['perf-0', 'perf-2'])
        assert len(mock_event_manager_methods['load_performances']()) == 8

        # Cycle 3: Delete perf-9, final reorder
        performances = mock_event_manager_methods['load_performances']()
        performances = [p for p in performances if p['id'] != 'perf-9']
        mock_event_manager_methods['save_performances'](performances)
        mock_event_manager_methods['reorder_performances'](['perf-7'])
        final_performances = mock_event_manager_methods['load_performances']()

        # Should have 7 performances (deleted 3, 6, 9)
        assert len(final_performances) == 7

        # Verify deleted ones are gone
        final_ids = [p['id'] for p in final_performances]
        assert 'perf-3' not in final_ids
        assert 'perf-6' not in final_ids
        assert 'perf-9' not in final_ids

        # Verify remaining 7 exist
        expected_remaining = [0, 1, 2, 4, 5, 7, 8]
        for i in expected_remaining:
            assert f'perf-{i}' in final_ids


@pytest.mark.unit
class TestFileLocking:
    """Test file locking prevents concurrent write corruption"""

    def test_file_lock_context_manager(self, temp_dir):
        """Test that file_lock context manager works correctly"""
        from app import file_lock

        test_file = temp_dir / 'test.json'
        test_file.write_text('{}')

        # Should be able to acquire lock
        with file_lock(test_file):
            # Write some data
            with open(test_file, 'w') as f:
                json.dump({'test': 'data'}, f)

        # Lock should be released, read data
        with open(test_file, 'r') as f:
            data = json.load(f)
            assert data == {'test': 'data'}

    def test_file_lock_creates_lock_file(self, temp_dir):
        """Test that file_lock creates a .lock file"""
        from app import file_lock

        test_file = temp_dir / 'test.json'
        test_file.write_text('{}')
        lock_file = temp_dir / '.test.json.lock'

        with file_lock(test_file):
            assert lock_file.exists()

    def test_file_lock_with_nested_writes(self, temp_dir):
        """Test file locking with multiple sequential writes"""
        from app import file_lock

        test_file = temp_dir / 'test.json'
        test_file.write_text('{}')

        # First write
        with file_lock(test_file):
            with open(test_file, 'w') as f:
                json.dump({'count': 1}, f)

        # Second write
        with file_lock(test_file):
            with open(test_file, 'r') as f:
                data = json.load(f)
            data['count'] += 1
            with open(test_file, 'w') as f:
                json.dump(data, f)

        # Verify
        with open(test_file, 'r') as f:
            data = json.load(f)
            assert data['count'] == 2
