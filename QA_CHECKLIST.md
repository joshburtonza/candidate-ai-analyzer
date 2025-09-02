# Advanced Filters QA Checklist

## Feature Flag Testing

### With enableAdvancedFilters=false
- [ ] Dashboard shows identical behavior to before implementation
- [ ] No AdvancedFilters component visible on either tab
- [ ] Existing filters (vertical/preset/strict) work unchanged
- [ ] Single-day calendar selection works as before
- [ ] Export functions work with existing data

### With enableAdvancedFilters=true
- [ ] AdvancedFilters component visible above CandidateGrid on both tabs
- [ ] Filter state persists to localStorage key `advancedFilters.v1`
- [ ] Reset clears both UI and localStorage
- [ ] Feature flag can be toggled in Account Settings

## Advanced Filter Controls

### Search Filter
- [ ] Requires minimum 2 characters to activate
- [ ] Searches across: candidate_name, email_address, current_employment, countries
- [ ] Case-insensitive matching
- [ ] Debounced updates (300ms)

### Source Email Filter
- [ ] Dropdown populated with unique emails from current dataset
- [ ] Multi-select with chip display
- [ ] Case-insensitive exact matching
- [ ] Sources: source_email field OR extracted_json.email_address
- [ ] Remove chips by clicking X

### Countries Filter
- [ ] Multi-select dropdown from available countries in dataset
- [ ] OR logic (selecting USA OR UK shows candidates from either)
- [ ] Case-insensitive partial matching
- [ ] Remove chips by clicking X

### Skills Filter
- [ ] Multi-select dropdown from current_employment field
- [ ] AND logic (selecting React AND TypeScript requires both)
- [ ] Case-insensitive partial matching
- [ ] Remove chips by clicking X

### Score Range Filter
- [ ] Slider from 5-10 (inclusive endpoints)
- [ ] Parses different formats: "8", "8.0", "8/10"
- [ ] Normalizes scores >10 by dividing by 10
- [ ] Real-time filtering as slider moves

### Date Range Filter
- [ ] Two date inputs: From and To
- [ ] Both dates inclusive
- [ ] Uses received_date primarily, falls back to extracted_json.date_received
- [ ] Either field can be empty (no range limit on that side)
- [ ] Format: YYYY-MM-DD

## View Constraints (Preserved)

### "All Uploads" Tab
- [ ] No name requirement (includes candidates with empty names)
- [ ] No deduplication (multiple CVs from same person shown)
- [ ] Uses API endpoint for date filtering when available
- [ ] Falls back to client-side filtering for date range when API unavailable

### "Best Candidates" Tab
- [ ] Requires non-empty candidate_name
- [ ] Deduplicates by normalized first/last name
- [ ] Client-side filtering for single-day selection
- [ ] Preserves existing vertical/preset/strict filtering logic

## Integration Testing

### Single Day Selection (Calendar)
- [ ] All Uploads: Uses candidates-by-date API as before
- [ ] Best Candidates: Client-side filtering as before
- [ ] Advanced filters apply to selected day results
- [ ] Counts in tab badges reflect filtered results

### Date Range vs Single Day Priority
- [ ] When both calendar date AND date range selected, calendar date takes precedence
- [ ] Clear calendar selection to see date range results
- [ ] Visual indicator shows which date constraint is active

### Vertical/Preset/Strict Compatibility
- [ ] Advanced filters compose with existing vertical filtering
- [ ] Preset filtering preserved when enableFilterPresets=true
- [ ] Strict mode behavior unchanged
- [ ] Feature flag combinations work correctly

### Export Functions
- [ ] CSV export includes filtered results (respects advanced filters)
- [ ] PDF export includes filtered results
- [ ] Filename reflects active filters and date selection
- [ ] Export progress indicator works

## Performance Testing

### Large Datasets
- [ ] 500+ candidates: filtering completes <100ms
- [ ] 1000+ candidates: filtering completes <200ms
- [ ] No UI freezing during filter application
- [ ] Debouncing prevents excessive recalculation

### Memory Usage
- [ ] No memory leaks when changing filters repeatedly
- [ ] LocalStorage usage remains reasonable
- [ ] Component cleanup on unmount

## Data Edge Cases

### Missing/Invalid Data
- [ ] Handles candidates with null/undefined extracted_json
- [ ] Empty candidate_name handled correctly
- [ ] Invalid score formats (empty, non-numeric) gracefully handled
- [ ] Missing countries/skills arrays handled
- [ ] Invalid date formats handled

### Score Parsing
- [ ] "8" → 8
- [ ] "8.5" → 9 (rounded)
- [ ] "8/10" → 8
- [ ] "85" → 9 (85/10 = 8.5, rounded)
- [ ] "0" → 0
- [ ] "" → 0
- [ ] "invalid" → 0

### Array vs String Handling
- [ ] Countries as string: "USA,UK" → ["USA", "UK"]
- [ ] Countries as array: ["USA", "UK"] → ["USA", "UK"]
- [ ] Skills as string: "React, TypeScript" → ["React", "TypeScript"]
- [ ] Skills as array: ["React", "TypeScript"] → ["React", "TypeScript"]

## Error Handling

### API Failures
- [ ] Date range endpoint failure falls back to daily API calls
- [ ] Daily API failures fall back to client-side filtering
- [ ] Loading states shown during fallback operations
- [ ] Error messages don't break UI

### LocalStorage Issues
- [ ] Corrupt localStorage data doesn't crash app
- [ ] Missing localStorage permissions handled gracefully
- [ ] Full storage quota handled appropriately

## User Experience

### Filter Interactions
- [ ] Clear All removes all filters and updates localStorage
- [ ] Active filter count badge accurate
- [ ] Filter panel collapse/expand smooth
- [ ] Filter changes reflect immediately in results

### Responsive Design
- [ ] Advanced filters work on mobile/tablet
- [ ] Date inputs accessible on touch devices
- [ ] Multi-select dropdowns usable on small screens
- [ ] Filter chips wrap appropriately

### Accessibility
- [ ] All form controls keyboard accessible
- [ ] Screen reader friendly labels
- [ ] Focus management in dropdowns
- [ ] Color contrast meets standards

## Rollback Testing

### Disable Feature Flag
- [ ] Toggling enableAdvancedFilters=false immediately hides filters
- [ ] Existing data/filtering reverts to original behavior
- [ ] No errors in console after disabling
- [ ] localStorage preserved for re-enabling

### Data Integrity
- [ ] No data modification during filtering
- [ ] Original upload data unchanged
- [ ] Filter application doesn't mutate arrays
- [ ] Concurrent user operations don't interfere

## Manual Test Scenarios

### Scenario 1: Education Recruiter Daily Workflow
1. Enable advanced filters feature flag
2. Select calendar date with 10+ candidates
3. Filter by source email "hr@school.com"
4. Add country filter for "South Africa"
5. Set score range 7-10
6. Export filtered results to PDF
7. Verify: Only relevant candidates exported

### Scenario 2: Multi-Day Range Analysis
1. Clear calendar date selection
2. Set date range: last 7 days
3. Search for "teacher" in search box
4. Filter skills: "Mathematics" AND "Secondary"
5. Verify: Results span multiple days, meet all criteria
6. Switch to "All Uploads" tab
7. Verify: Same filters apply, no deduplication

### Scenario 3: Large Dataset Performance
1. Upload/import 500+ CV records
2. Enable all advanced filters
3. Apply complex filter combination
4. Measure response time (<200ms expected)
5. Change filters rapidly
6. Verify: No UI lag or freezing

### Scenario 4: Mobile/Tablet Usage
1. Access on mobile device
2. Open advanced filters panel
3. Use date picker inputs
4. Select multiple skills from dropdown
5. Verify: Usable experience on touch device

### Scenario 5: Fallback Resilience
1. Block access to candidates-by-range endpoint
2. Set date range filter
3. Verify: Fallback to daily API calls works
4. Block daily endpoint too
5. Verify: Client-side filtering as final fallback

## Success Criteria

- [ ] All existing functionality preserved when feature disabled
- [ ] Advanced filters provide enhanced filtering when enabled
- [ ] Performance remains acceptable with large datasets
- [ ] User experience consistent across devices
- [ ] Error scenarios handled gracefully
- [ ] Data integrity maintained throughout