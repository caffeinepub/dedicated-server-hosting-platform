# Specification

## Summary
**Goal:** Fix the infinite loop in admin setup error handling that prevents users from accessing the application.

**Planned changes:**
- Remove automatic page refresh from AdminSetupNotice component's error handling
- Implement graceful error state with manual retry option instead of automatic refresh
- Fix backend admin assignment logic to correctly identify when no admin exists
- Ensure hasAdminBeenAssigned flag accurately reflects actual admin state
- Resolve false positive "admin already exists" errors during initial setup

**User-visible outcome:** Users can access the application without experiencing infinite page refresh loops when admin setup encounters an error. The error message is displayed clearly with a manual retry option, allowing users to continue using the application.
