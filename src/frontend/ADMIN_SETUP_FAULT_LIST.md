# Admin Setup Fault List

This document lists known faults in the admin setup flow, their symptoms, causes, and fixes.

---

## Quick Reference: Frontend File Tree

For a comprehensive inventory of all frontend files and their purposes, see **[`frontend/FRONTEND_FILE_TREE.md`](./FRONTEND_FILE_TREE.md)**.

Key admin setup flow files:
- `frontend/src/hooks/useQueries.ts` - Admin status and auto-assignment hooks
- `frontend/src/components/AdminSetupNotice.tsx` - Auto-assignment UI component
- `frontend/src/components/Layout.tsx` - Renders AdminSetupNotice banner
- `frontend/src/components/Header.tsx` - Conditional Admin menu link
- `frontend/src/pages/AdminPage.tsx` - Admin panel with access control
- `frontend/src/hooks/useActor.ts` - Backend actor initialization

---

## Fault 1: "Admin already exists" Error on Fresh Deployment

**Symptom:**
- Red error banner appears on page load: "Admin Setup Error: An admin already exists. Refreshing the page..."
- Occurs even when no admin has been assigned
- Page refreshes in a loop

**Cause:**
- Backend `accessControlState.adminAssigned` flag is set to `true` during initialization or upgrade, even when no actual admin role exists in the roles map
- Frontend calls `checkAdminStatus()` which returns `hasAdmin: true` based on the flag
- Frontend then calls `autoAssignAdminOnLogin()` which returns `false` (because flag is already true)
- Frontend interprets `false` as "admin already exists" error

**Fix:**
- Backend migration added in `backend/migration.mo` to reset `adminAssigned` flag when no real admin role exists
- Migration runs automatically during canister upgrade
- Ensures `adminAssigned` flag accurately reflects actual admin role existence

**Debugging:**
1. Check backend state: `dfx canister call backend checkAdminStatus`
2. Expected result when no admin exists: `{ hasAdmin = false; adminCount = 0; isAnonymous = <varies> }`
3. If `hasAdmin = true` but no admin role exists, migration will fix on next upgrade

---

## Fault 2: Inconsistent Admin State Between Queries

**Symptom:**
- `hasAdmin()` returns different result than `checkAdminStatus().hasAdmin`
- Admin link appears/disappears inconsistently
- Access control behaves unpredictably

**Cause:**
- Multiple backend methods returning admin state (`hasAdmin()`, `isAdminSetUp()`, `checkAdminStatus()`)
- Frontend using different hooks that call different backend methods
- Race conditions between queries

**Fix:**
- Unified all admin status checks to use single source of truth: `checkAdminStatus()`
- Frontend hooks now use:
  - `useAdminStatus()` → calls `checkAdminStatus()` (unified)
  - `useHasAdmin()` → derived from `useAdminStatus()`
  - `useIsCallerAdmin()` → calls `getCallerUserRole()` from AccessControl
- Deprecated methods kept for backward compatibility but not used in frontend

**Debugging:**
1. Check which hook is being used in the component
2. Ensure all admin checks use `useAdminStatus()` or `useIsCallerAdmin()`
3. Never mix `hasAdmin()` and `checkAdminStatus()` calls

---

## Fault 3: Profile Setup Modal Flashes Before Admin Assignment

**Symptom:**
- Profile setup modal briefly appears on first login
- Modal disappears after admin is assigned
- Creates confusing UX

**Cause:**
- Profile setup modal checks `userProfile === null` to decide whether to show
- Query returns `null` briefly before admin assignment completes
- Modal renders before admin flow finishes

**Fix:**
- Added `isFetched` guard to profile setup modal visibility logic
- Modal only shows when: `isAuthenticated && !profileLoading && isFetched && userProfile === null`
- Custom `useGetCallerUserProfile()` hook returns proper loading state:
  ```typescript
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
  ```

**Debugging:**
1. Check `ProfileSetupModal.tsx` visibility condition
2. Ensure `isFetched` is included in the condition
3. Verify `useGetCallerUserProfile()` returns correct `isFetched` state

---

## Fault 4: Forced Page Reload Causes State Loss

**Symptom:**
- Page reloads automatically after admin assignment
- Shopping cart cleared
- User loses navigation context
- Poor UX

**Cause:**
- Old implementation used `window.location.reload()` after admin assignment
- Reload clears all React Query cache and local state
- Unnecessary because React Query invalidation is sufficient

**Fix:**
- Removed all `window.location.reload()` calls from admin setup flow
- Use React Query's `invalidateQueries()` and `refetchQueries()` instead
- State updates propagate automatically through React Query
- Only reload on actual errors (e.g., "admin already exists" conflict)

**Debugging:**
1. Search codebase for `window.location.reload()`
2. Should only appear in error recovery paths, not success paths
3. Check browser console for unexpected page reloads

---

## General Debugging Tips

### Check Backend State
