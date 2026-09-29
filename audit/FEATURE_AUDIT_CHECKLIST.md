# Social Yolo AI — Feature Implementation & Completeness Checklist

**Author:** QA Engineer & Senior Full-Stack Developer  
**Date:** September 29, 2026  
**Status:** Complete Code-Level Verification  
**Legend:**
-  **Implemented & Verified:** Fully functioning with real backend and database integration.
- ⚠️ **Partially Implemented:** Functional but contains notable defects, missing edge cases, or security flaws.
- ❌ **Not Implemented / Phantom:** Claimed in documentation, types, or UI options, but absent from actual code.

---

## 1. Authentication & User Management

| Feature / Capability | Frontend Status | Backend Status | DB Entity / Table | Audit Verification Notes |
| :--- | :---: | :---: | :--- | :--- |
| **Email/Password Registration** |  Verified |  Verified | `users` | Validated via `RegisterDto`. Passwords hashed with bcrypt (salt rounds: 10). Starting balance: 50 credits. |
| **Email/Password Login** |  Verified |  Verified | `users` | Validated via `LoginDto`. Returns signed JWT token and sets HTTP-only `access_token` cookie. |
| **Google OAuth 2.0 (Official)** |  Verified |  Verified | `users` | Code/credential exchange via `google-auth-library` (`OAuth2Client`). Links Google account by email. |
| **Instant Google Login (Dev)** |  Verified | ⚠️ Security Risk | `users` | `POST /auth/google/instant` bypasses Google credentials. Restricted only by `process.env.NODE_ENV === 'production'`. |
| **Password Reset (Forgot/Reset)** | ⚠️ Partial | ⚠️ Partial | `users` (`reset_password_token`) | Generates crypto token with 15-min expiry. In production, **does not dispatch an email (no SMTP configured)**. |
| **Password Change (Authenticated)**|  Verified |  Verified | `users` | Verified against current password hash. Enforces authentication via `JwtAuthGuard`. |
| **User Role-Based Access Control** |  Verified |  Verified | `users` (`role`) | Roles: `admin`, `user`. Backend enforces via `@Roles(UserRole.ADMIN)` and `RolesGuard`. |
| **Admin User List & Search** |  Verified |  Verified | `users` | Admin panel at `/admin/users` lists users with pagination and search. |
| **Admin Role & Status Updates** |  Verified |  Verified | `users` | Admin can toggle active status and update user roles (`USER` <-> `ADMIN`). |

---

## 2. AI Studio & Content Generation Pipeline

| Feature / Capability | Frontend Status | Backend Status | DB Entity / Table | Audit Verification Notes |
| :--- | :---: | :---: | :--- | :--- |
| **8-Step Guided Post Wizard** |  Verified |  Verified | `posts` | Step 1: Brand DNA, Step 2: Post Type, Step 3: Idea, Step 4: Audience, Step 5: Style, Step 6: Platform/Ratio, Step 7: Visual Direction, Step 8: Review. |
| **Freeform Post Generation** |  Verified |  Verified | `posts` | `POST /api/posts/generate`. Accepts text prompt and optional hero image. |
| **Multi-Image Product Ingestion** |  Verified |  Verified | `public/uploads` | Accepts up to 6 product images. Passes them to Gemini API for multi-asset understanding. |
| **Human Model Identity Ingestion**|  Verified |  Verified | `public/uploads` | Supports dedicated `model` file. Anchors prompt to replicate exact facial and human features. |
| **Logo Overlay / Ingestion** |  Verified |  Verified | `public/uploads` | Supports logo image upload. Encodes to base64 and hands to Gemini vision prompt. |
| **Multi-Variant Generation (1–4)** |  Verified |  Verified | `posts` (`variants`) | Allows selecting 1, 2, 3, or 4 distinct creative variants. Multiplies credit cost accordingly. |
| **AI Vision Product Scanner** |  Verified | ⚠️ Unmetered | Gemini Vision | `POST /api/posts/analyze-image` calls Gemini Vision to extract colors, niche, and headlines. **Consumes 0 credits**. |
| **Two-Stage Design Planning** | N/A |  Verified | In-memory | `GeminiService.planDesign` queries `gemini-2.5-flash` for an art direction plan prior to image generation. |
| **AI Marketing Copywriting** |  Verified |  Verified | `posts` (`headline`, `bodyCopy`, `cta`) | Generates punchy headlines (<8 words), non-repeating body copy, and CTAs. Falls back cleanly to templates. |
| **RAG Style Retrieval** | N/A | ⚠️ Scalability | `post_embeddings` | Embeds prompts with `gemini-embedding-001`. Performs in-memory cosine similarity across all past posts. |
| **AI Video Generation** | ❌ Phantom | ❌ Not Implemented | None | **Zero video generation code exists.** Only aspect ratios for `tiktok_video` (9:16) exist in prompts. |

---

## 3. Brand DNA & Profile Extraction

| Feature / Capability | Frontend Status | Backend Status | DB Entity / Table | Audit Verification Notes |
| :--- | :---: | :---: | :--- | :--- |
| **Website Brand Scraping** |  Verified |  Verified | In-memory | `POST /api/brands/extract-from-url` extracts title, meta description, and detects primary colors. |
| **Brand DNA Profile Creation** |  Verified | ⚠️ Security Risk | `brand_profiles` | Saves brand name, colors, typography, tone, tagline. **Vulnerable to `x-user-id` tenant spoofing**. |
| **Brand Profiles Listing** |  Verified | ⚠️ Security Risk | `brand_profiles` | Lists profiles for user. If unauthenticated, **falls back to primary admin user profiles**. |
| **Default Brand Auto-Selection** |  Verified |  Verified | `brand_profiles` (`is_default`) | Auto-populates brand details into Step 1 of AI Studio Wizard. |
| **Brand Profile Editing / Deletion**|  Verified | ⚠️ Security Risk | `brand_profiles` | Updates and deletes profiles. Relies on vulnerable `resolveUserId` method. |

---

## 4. Background Removal & Image Processing

| Feature / Capability | Frontend Status | Backend Status | DB Entity / Table | Audit Verification Notes |
| :--- | :---: | :---: | :--- | :--- |
| **Native Node.js ONNX Bg-Removal** |  Verified |  Verified | In-memory / Disk | Uses `@imgly/background-removal-node`. Does not require external Python service. |
| **Hybrid Job Queue (Redis + Mem)**| N/A |  Verified | Redis / Local Map | `BackgroundRemovalQueueService` throttles concurrency to `maxConcurrency = 2`. |
| **Large File Safety Cutoff** | N/A |  Verified | In-memory | Images > 2.5MB bypass ONNX (`passthrough-large-asset`) to prevent V8 out-of-memory heap crash. |
| **Standalone Bg-Remover Screen** |  Verified | ⚠️ Unmetered | In-memory | Dedicated UI at `/dashboard/bg-remover`. Calls backend but **does not deduct the 3 credit cost**. |
| **Python FastAPI Microservice** | N/A | ⚠️ Unprotected | None | Standalone service in `image-service/main.py`. Unused by default; CORS `*` with zero authentication. |

---

## 5. Wallet, Credits, Discounts & Billing

| Feature / Capability | Frontend Status | Backend Status | DB Entity / Table | Audit Verification Notes |
| :--- | :---: | :---: | :--- | :--- |
| **Database-Backed User Wallets** |  Verified |  Verified | `wallets` | Real columns: `currentBalance`, `totalPurchased`, `totalUsed`, `totalRefunded`. All 18 DB users seeded. |
| **Atomic Deductions (Locks)** |  Verified |  Verified | `wallets` / `credit_transactions` | Uses `pessimistic_write` (`FOR UPDATE`) in DB transaction. Zero negative balances allowed. |
| **Atomic Failure Refunds** |  Verified |  Verified | `wallets` / `credit_transactions` | Post generation failures trigger `refundCredits` inside database transaction with notification. |
| **Insufficient Credits Studio Flow**|  Verified |  Verified | `wallets` | `PostGenerator.tsx` blocks generation and displays required, available, needed credits with Buy CTA. |
| **Dynamic Feature Credit Costs** |  Verified |  Verified | `credit_costs` | Costs stored in DB: `AI_POST_GENERATION` (5), `AI_IMAGE_GENERATION` (10), `BACKGROUND_REMOVAL` (3). |
| **Dynamic Credit Packages** |  Verified |  Verified | `credit_packages` | Starter (100 credits, $5), Growth (500, $20), Professional (1500, $50), Business (5000, $150). |
| **Discount / Promo Code Engine** |  Verified |  Verified | `discounts` / `coupon_usages` | Percentage and fixed discounts, minimum spend, maximum discount caps, usage limits, user limits. |
| **Checkout & Order Creation** |  Verified |  Verified | `orders` | Centralized pricing on backend (`PricingService`). Idempotent order processing. |
| **Payment Confirmation Webhook** | N/A | ⚠️ Security Risk | `payments` / `orders` | `/billing/webhook` confirms orders and credits wallets **without cryptographic signature check**. |
| **Admin Financial Dashboard** |  Verified |  Verified | All Billing Tables | Protected at `/admin/billing`. 7 tabs: Packages, Costs, Coupons, Wallets, Ledger, Orders, Audit Logs. |
| **Admin Credit Adjustments** |  Verified |  Verified | `admin_audit_logs` | Admin can Add, Remove, or Refund credits with mandatory reason and immutable audit log entry. |

---

## 6. Post Management & Social Gallery

| Feature / Capability | Frontend Status | Backend Status | DB Entity / Table | Audit Verification Notes |
| :--- | :---: | :---: | :--- | :--- |
| **Creation Gallery (`/dashboard/gallery`)**|  Verified | ⚠️ Multi-Tenant Leak | `posts` | Lists user's past generations. If unauthenticated, **returns all posts across all users**. |
| **Post Details View** |  Verified | ⚠️ IDOR Risk | `posts` | `GET /api/posts/:id` returns post by UUID without verifying whether requester owns the post. |
| **Favorite Toggling** |  Verified | ⚠️ Multi-Tenant Flaw| `posts` (`is_favorite`) | `is_favorite` is a global column on `posts` table rather than user-scoped relation. |
| **Favorites Screen (`/dashboard/favorites`)**|  Verified | ⚠️ Multi-Tenant Leak | `posts` | Lists favorited posts. If unauthenticated, **returns all favorited posts in the entire database**. |
| **Post Deletion** |  Verified |  Verified | `posts` | Deletes database record and cleans up physical image files from local disk. |
| **Post Rating & RAG Tuning** |  Verified |  Verified | `posts` (`rating`) | Saves 1–5 rating. Feeds high-rated posts into RAG retriever for personalized aesthetic tuning. |

---

## 7. Notifications & Real-Time Feedback

| Feature / Capability | Frontend Status | Backend Status | DB Entity / Table | Audit Verification Notes |
| :--- | :---: | :---: | :--- | :--- |
| **Notification Center (Topbar)** |  Verified |  Verified | `notifications` | Dropdown panel with unread badge counter and type filtering. |
| **Transactional Notifications** |  Verified |  Verified | `notifications` | Created upon generation completion, credit refund, and welcome bonus. |
| **Mark as Read / Mark All Read** |  Verified |  Verified | `notifications` | Updates `is_read = true` scoped strictly to `CurrentUser('id')`. |
| **Delete Notification** |  Verified |  Verified | `notifications` | Deletes single notification or all notifications for current user. |
