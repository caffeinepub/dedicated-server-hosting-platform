# Stripe API Key Configuration Guide

This document provides the **exact file locations** and instructions for configuring Stripe API keys in your application.

---

## Overview

Your application uses Stripe for payment processing. Stripe requires two types of API keys:

1. **Publishable Key** (`pk_test_*` or `pk_live_*`) - Safe to expose in frontend code
2. **Secret Key** (`sk_test_*` or `sk_live_*`) - Must be kept secure, never committed to version control

---

## Backend Configuration (Secret Key)

### Location: `backend/main.mo`

The Stripe **Secret Key** is configured in the backend Motoko canister via the `setStripeConfiguration()` function.

**Configuration Method:**

The application provides an admin interface for configuring Stripe. When you log in as an admin:

1. Navigate to the **Admin Panel** (accessible via the header menu after login)
2. Click the **"Configure Stripe"** button
3. Enter your Stripe Secret Key (format: `sk_test_...` for testing or `sk_live_...` for production)
4. Specify allowed countries (comma-separated, e.g., `US,CA,GB,DE,FR`)
5. Click **"Configure Stripe"**

**UI Component Location:** `frontend/src/components/StripeSetupModal.tsx`

**Backend Function:**
