# Frontend File Tree Documentation

This document provides a comprehensive inventory of the frontend codebase for the ServerHost dedicated server hosting platform. Use this as a quick reference to locate files and understand their purposes.

---

## Root Configuration Files

### `frontend/index.html`
HTML entry point for the React application. Contains the root div and script tag for mounting the React app.

### `frontend/package.json` (Read-only)
NPM package configuration with all dependencies, scripts, and project metadata. **Do not modify** - managed by the build system.

### `frontend/tsconfig.json` (Read-only)
TypeScript compiler configuration. **Do not modify** - managed by the build system.

### `frontend/vite.config.js` (Read-only)
Vite bundler configuration. **Do not modify** - managed by the build system.

### `frontend/postcss.config.js` (Read-only)
PostCSS configuration for Tailwind CSS processing. **Do not modify** - managed by the build system.

### `frontend/tailwind.config.js`
Tailwind CSS configuration with custom theme extensions, colors, fonts, and design tokens. **Editable** - customize for design requirements.

### `frontend/components.json`
Shadcn/ui components configuration file specifying component installation paths and style preferences.

### `frontend/ui-summary.json`
Auto-generated summary of available Shadcn UI components with their exports, variants, and usage information.

### `frontend/ADMIN_SETUP_FAULT_LIST.md`
Developer-facing documentation listing known admin setup faults, symptoms, causes, fixes, and debugging tips.

### `frontend/FRONTEND_FILE_TREE.md` (this file)
Comprehensive inventory of the frontend file structure with descriptions and purposes.

---

## Source Directory: `frontend/src/`

### Entry Points

#### `frontend/src/main.tsx` (Read-only)
Application entry point that sets up React Query, Internet Identity provider, and renders the root App component. **Do not modify** - managed by the build system.

#### `frontend/src/App.tsx`
Main application component with TanStack Router setup, theme provider, and route definitions for all pages (home, plans, dashboard, admin, payment status).

#### `frontend/src/config.ts` (Read-only)
Application configuration for backend canister connection and actor initialization. **Do not modify** - auto-generated.

---

### Styling

#### `frontend/src/index.css`
Global styles with OKLCH color system featuring a professional blue/purple color scheme optimized for both light and dark modes. Includes grid pattern utility and design tokens. **Editable** - customize for design requirements.

---

### Hooks: `frontend/src/hooks/`

#### `frontend/src/hooks/useInternetIdentity.ts` (Read-only)
Internet Identity authentication provider and hook for login/logout functionality. **Do not modify** - auto-generated.

#### `frontend/src/hooks/useActor.ts` (Read-only)
Hook that initializes the backend actor with Internet Identity, handles authentication state, and includes retry logic for robust connection handling. **Do not modify** - auto-generated.

#### `frontend/src/hooks/useQueries.ts`
**[ADMIN SETUP FLOW]** React Query hooks for all backend operations including:
- Server plan CRUD operations
- User profile management
- Shopping cart operations
- Checkout and payment
- Orders and invoices
- **Admin status checks** (`useAdminStatus`, `useHasAdmin`, `useIsCallerAdmin`)
- **Admin auto-assignment** (`useAutoAssignAdminOnLogin`)

This file is central to the admin setup flow and uses unified `checkAdminStatus()` for admin state.

---

### Components: `frontend/src/components/`

#### Admin Setup Flow Components

##### `frontend/src/components/AdminSetupNotice.tsx`
**[ADMIN SETUP FLOW]** Alert component that auto-assigns admin to first authenticated user using unified adminStatus hook. Displays loading, success, and error states during admin bootstrap. Removes forced reload and inconsistency error handling for clean bootstrap flow.

##### `frontend/src/components/Layout.tsx`
**[ADMIN SETUP FLOW]** Root layout component that wraps all pages with header, footer, **AdminSetupNotice banner**, and profile setup modal. The AdminSetupNotice is rendered at the top of every page.

##### `frontend/src/components/Header.tsx`
**[ADMIN SETUP FLOW]** Responsive navigation header with logo, menu links (including **conditional Admin link visible only to authenticated admins** using unified `isCallerAdmin` check), shopping cart indicator, login/logout functionality, and mobile menu.

#### Other Components

##### `frontend/src/components/Footer.tsx`
Simple footer component with copyright notice and caffeine.ai attribution link.

##### `frontend/src/components/ProfileSetupModal.tsx`
Modal dialog that prompts new users to complete their profile with name and email after first login.

##### `frontend/src/components/StripeSetupModal.tsx`
Admin modal for configuring Stripe payment integration with secret key and allowed countries.

---

### UI Components: `frontend/src/components/ui/` (Read-only)

**All files in this directory are read-only and auto-managed by Shadcn/ui.** Do not modify these files directly. Customize UI via component usage (props/className) and design tokens (index.css, tailwind.config.js).

Available components include:
- Accordion, Alert, AlertDialog, AspectRatio, Avatar
- Badge, Breadcrumb, Button
- Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu
- Dialog, Drawer, DropdownMenu
- Form
- HoverCard
- Input, InputOTP
- Label
- Menubar
- NavigationMenu
- Pagination, Popover, Progress
- RadioGroup, Resizable
- ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner (Toaster), Switch
- Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip

See `frontend/ui-summary.json` for detailed export information.

---

### Pages: `frontend/src/pages/`

#### `frontend/src/pages/HomePage.tsx`
Landing page with hero section featuring datacenter imagery, feature cards highlighting server benefits, and call-to-action sections.

#### `frontend/src/pages/PlansPage.tsx`
Server plans browsing page displaying available dedicated server configurations with specifications, pricing, and add-to-cart functionality.

#### `frontend/src/pages/DashboardPage.tsx`
User dashboard with tabbed interface for managing shopping cart, viewing order history, and accessing invoices with checkout functionality.

#### `frontend/src/pages/AdminPage.tsx`
**[ADMIN SETUP FLOW]** Admin panel with tabs for managing server plans (CRUD operations), viewing all orders, and managing users with Stripe configuration access. Uses unified `isCallerAdmin` check with `isFetched` guard for access control.

#### `frontend/src/pages/PaymentSuccessPage.tsx`
Payment success confirmation page that clears the cart and provides navigation to dashboard or plans.

#### `frontend/src/pages/PaymentFailurePage.tsx`
Payment failure page informing users of unsuccessful payment and offering options to retry or browse plans.

---

## Backend Interface

### `frontend/src/backend.d.ts` (Read-only)
TypeScript interface definitions for the backend canister. **Do not modify** - auto-generated from Motoko backend.

---

## Admin Setup Flow - Quick Reference

If you need to debug or modify the admin setup flow, these are the key files:

1. **`frontend/src/hooks/useQueries.ts`** - Contains `useAdminStatus()`, `useIsCallerAdmin()`, `useAutoAssignAdminOnLogin()` hooks
2. **`frontend/src/components/AdminSetupNotice.tsx`** - UI component that triggers auto-assignment and displays status
3. **`frontend/src/components/Layout.tsx`** - Renders AdminSetupNotice banner on all pages
4. **`frontend/src/components/Header.tsx`** - Conditionally shows Admin menu link based on `isCallerAdmin`
5. **`frontend/src/pages/AdminPage.tsx`** - Admin panel with access control using `isCallerAdmin`
6. **`frontend/src/hooks/useActor.ts`** - Initializes backend actor with authentication

For detailed troubleshooting, see `frontend/ADMIN_SETUP_FAULT_LIST.md`.

---

## Development Guidelines

### Read-only Files (Do Not Modify)
- `frontend/package.json`
- `frontend/postcss.config.js`
- `frontend/tsconfig.json`
- `frontend/vite.config.js`
- `frontend/src/main.tsx`
- `frontend/src/config.ts`
- `frontend/src/hooks/useInternetIdentity.ts`
- `frontend/src/hooks/useActor.ts`
- `frontend/src/backend.d.ts`
- All files under `frontend/src/components/ui/`

### Editable Files
- `frontend/tailwind.config.js` - Customize design tokens
- `frontend/src/index.css` - Customize global styles and OKLCH colors
- `frontend/src/App.tsx` - Add/modify routes
- `frontend/src/hooks/useQueries.ts` - Add/modify backend query hooks
- All files under `frontend/src/components/` (except `ui/`)
- All files under `frontend/src/pages/`

### Asset Paths
- Static assets: `/assets/filename`
- Generated images: `/assets/generated/filename`

---

## Architecture Notes

- **State Management**: React Query for server state, useState/useContext for local UI state
- **Routing**: TanStack Router with file-based route definitions
- **Styling**: Tailwind CSS with OKLCH color system, Shadcn/ui components
- **Authentication**: Internet Identity with automatic admin bootstrap
- **Backend**: Motoko canister on Internet Computer with query/update calls
- **Payment**: Stripe integration with checkout sessions

---

**Last Updated**: February 7, 2026
