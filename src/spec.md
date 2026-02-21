# Specification

## Summary
**Goal:** Fix first admin authentication, build a complete admin dashboard with server and plan management capabilities, and integrate Stripe for subscription payments.

**Planned changes:**
- Fix authentication logic so the first user to sign in with Internet Identity is automatically granted admin status without requiring an invitation code
- Create an admin dashboard page displaying all dedicated servers with status, specifications, and assignment information
- Implement server management functions: create new servers with specifications, assign servers to users or plans, delete servers with confirmation
- Create subscription plans management interface showing all plans with pricing, specs, and billing periods
- Implement plan creation and editing with fields for name, price, CPU/RAM/storage specs, and billing period (monthly, quarterly, annually)
- Integrate Stripe API for payment processing allowing users to purchase subscription plans through Stripe checkout
- Ensure all admin features are protected by proper access control

**User-visible outcome:** The first authenticated user becomes the main admin automatically. Admins can access a comprehensive dashboard to manage dedicated servers (create, view, assign to users or plans, delete) and subscription plans (create, edit, view). Users can purchase subscription plans through integrated Stripe checkout, with proper payment success and failure handling.
