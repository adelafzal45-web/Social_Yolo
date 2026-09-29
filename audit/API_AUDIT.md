# Social Yolo AI — REST API Endpoints & Contract Audit

**Author:** Senior Full-Stack Developer & Security Auditor  
**Date:** September 29, 2026  
**Status:** Complete Code-Level Endpoint Inspection  
**Base Path:** `/api` (Global Prefix configured in `main.ts`)

---

## 1. Complete REST API Catalog

### Auth Module (`/api/auth`)

| Method | Endpoint | Auth Guard | DTO Validation | Rate Limit | Status Codes | Audit Findings |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `POST` | `/auth/register` | `@Public()` | `RegisterDto` (class-validator) | None | `201`, `400` | Sets HTTP-only `access_token` cookie. Passwords hashed. Validates unique email. |
| `POST` | `/auth/login` | `@Public()` | `LoginDto` (class-validator) | None | `200`, `401` | Returns JWT and sets HTTP-only cookie. |
| `GET` | `/auth/google` | `@Public()` | Query params | None | `302` | In development, redirects to `/auth/callback?instant=true` if Google OAuth credentials missing. |
| `GET` | `/auth/google/callback` | `@Public()` | Query params (`code`, `error`) | None | `302` | Exchanges authorization code for Google access token and signs local JWT. |
| `POST` | `/auth/google` | `@Public()` | Unvalidated raw body | None | `200`, `401` | Body accepts `{ credential?, code?, redirectUri? }`. Missing class-validator DTO. |
| `POST` | `/auth/google/instant` | `@Public()` | Unvalidated raw body | None | `200`, `403` | **SECURITY GAP:** Permissive bypass in non-production. Any email can be impersonated without password. |
| `POST` | `/auth/logout` | None | None | None | `200` | Clears `access_token` and `social_yolo_jwt_token` cookies. |
| `POST` | `/auth/forgot-password`| `@Public()` | `ForgotPasswordDto` | None | `200` | **DEFECT:** Does not send emails in production. In development, leaks `devToken` in response. |
| `POST` | `/auth/reset-password` | `@Public()` | `ResetPasswordDto` | None | `200`, `400` | Verifies SHA-256 hashed token against `reset_password_token` column. 15-minute TTL. |
| `POST` | `/auth/change-password`| `JwtAuthGuard` | `ChangePasswordDto` | None | `200`, `400`, `401`| Properly verifies existing password hash before updating. |
| `GET` | `/auth/me` | `JwtAuthGuard` | None | None | `200`, `401` | Returns user profile and refreshes session cookie. |
| `POST` | `/auth/refresh` | `JwtAuthGuard` | None | None | `200`, `401` | Re-issues JWT token. |

---

### AI Post Generator Module (`/api/posts`)

| Method | Endpoint | Auth Guard | DTO Validation | Rate Limit | Status Codes | Audit Findings |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `POST` | `/posts/create-guided` | ❌ None | `CreateGuidedPostDto` | Sliding Window | `201`, `400`, `429` | **CRITICAL DEFECT:** No auth guard. If unauthenticated, `userId` is `null`, bypassing all credit deductions. |
| `POST` | `/posts/generate` | ❌ None | `GeneratePostDto` | Sliding Window | `201`, `400`, `429` | **CRITICAL DEFECT:** Freeform generation also lacks auth guard and skips credit deduction when unauthenticated. |
| `POST` | `/posts/analyze-image` | ❌ None | Multipart file | ❌ None | `200`, `400` | Calls Gemini Vision with zero rate limit and zero credit deduction. Anonymous model abuse risk. |
| `GET` | `/posts` | ❌ None | Query params | None | `200` | **MULTI-TENANT LEAK:** If unauthenticated, returns all posts across all users in the database. |
| `GET` | `/posts/favorites` | ❌ None | None | None | `200` | **MULTI-TENANT LEAK:** If unauthenticated, returns all favorited posts across all users in the database. |
| `GET` | `/posts/:id` | ❌ None | `ParseUUIDPipe` | None | `200`, `404` | **IDOR RISK:** Any user or anonymous client can view any generated post by guessing or knowing UUID. |
| `POST` | `/posts/:id/favorite` | ❌ None | `ParseUUIDPipe` | None | `200`, `404` | **MULTI-TENANT FLAW:** `isFavorite` is toggled globally on the post record; not scoped to user. |
| `DELETE`| `/posts/:id` | ❌ None | `ParseUUIDPipe` | None | `200`, `403`, `404`| Verifies `post.userId === requestingUserId`. If post was created anonymously, anyone can delete it! |
| `POST` | `/posts/:id/rate` | ❌ None | `RatePostDto` | None | `200`, `404` | Stores rating (1–5) for RAG aesthetic tuning. Accepts anonymous ratings. |

---

### Brand DNA Module (`/api/brands`)

| Method | Endpoint | Auth Guard | DTO Validation | Rate Limit | Status Codes | Audit Findings |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `POST` | `/brands/extract-from-url`| None | `ExtractBrandUrlDto` | None | `200`, `400` | Scrapes external website URL. Server-Side Request Forgery (SSRF) risk if URL is internal IP. |
| `GET` | `/brands` | ❌ Custom | None | None | `200`, `400` | **CRITICAL VULNERABILITY:** Accepts raw `x-user-id` header. If missing, defaults to system administrator. |
| `GET` | `/brands/:id` | ❌ Custom | `ParseUUIDPipe` | None | `200`, `400`, `404`| **CRITICAL VULNERABILITY:** Same `x-user-id` header spoofing and admin fallback vulnerability. |
| `POST` | `/brands` | ❌ Custom | `CreateBrandDto` | None | `201`, `400` | Creates Brand DNA profile. Can create profiles under victim or admin user accounts. |
| `PUT` | `/brands/:id` | ❌ Custom | `UpdateBrandDto` | None | `200`, `400`, `404`| Updates Brand DNA profile. Can overwrite victim or admin brand identities. |
| `DELETE`| `/brands/:id` | ❌ Custom | `ParseUUIDPipe` | None | `200`, `400`, `404`| Deletes Brand DNA profile with same spoofing exposure. |

---

### Image Processing Module (`/api/image-processing`)

| Method | Endpoint | Auth Guard | DTO Validation | Rate Limit | Status Codes | Audit Findings |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `POST` | `/image-processing/remove-background` | `JwtAuthGuard` | Multipart file | Queue MaxCon=2 | `201`, `400`, `500` | **BILLING DEFECT:** Processes ONNX background removal for free; does not deduct the 3 credit cost. |
| `POST` | `/image-processing/queue` | `JwtAuthGuard` | Multipart file | Queue MaxCon=2 | `201`, `400` | Asynchronous queue entry. Returns `{ jobId, status: 'queued', queuePosition }`. |
| `GET` | `/image-processing/job/:id` | `JwtAuthGuard` | Path param `id` | None | `200`, `404` | Polls job status from Redis or memory map. |

---

### Billing & Wallet Module (`/api/billing`)

| Method | Endpoint | Auth Guard | DTO Validation | Rate Limit | Status Codes | Audit Findings |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `GET` | `/billing/summary` | `JwtAuthGuard` | None | None | `200`, `401` | Returns real-time database wallet balance, plan, and 50 most recent immutable ledger transactions. |
| `GET` | `/billing/packages` | None (Public) | None | None | `200` | Returns active credit packages with prices and badges. |
| `POST` | `/billing/validate-coupon`| `JwtAuthGuard` | `ValidateCouponDto` | None | `200`, `401`, `404`| Centralized backend price calculator. Validates promo code limits, caps, and expirations. |
| `POST` | `/billing/checkout` | `JwtAuthGuard` | `CheckoutDto` | None | `200`, `401` | Creates order with server-calculated price and confirms payment using pessimistic locking. |
| `POST` | `/billing/webhook` | ❌ None | `WebhookDto` | None | `200` | **CRITICAL VULNERABILITY:** Does not verify cryptographic signature against shared webhook secret. |

---

### Admin Billing Module (`/api/admin/billing`)

| Method | Endpoint | Auth Guard | DTO Validation | Role Required | Status Codes | Audit Findings |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `GET` | `/admin/billing/stats` | `JwtAuthGuard` | None | `UserRole.ADMIN` | `200`, `401`, `403` | Returns total revenue, total credits in circulation, purchased/used credits, and orders count. |
| `GET` | `/admin/billing/packages`| `JwtAuthGuard` | None | `UserRole.ADMIN` | `200`, `401`, `403` | Returns all packages (active & inactive). |
| `POST` | `/admin/billing/packages`| `JwtAuthGuard` | `CreatePackageDto` | `UserRole.ADMIN` | `201`, `401`, `403` | Creates new commercial credit package. |
| `PATCH`| `/admin/billing/packages/:id`| `JwtAuthGuard` | `UpdatePackageDto` | `UserRole.ADMIN` | `200`, `401`, `403` | Updates price, credits, discount, and featured status. |
| `DELETE`| `/admin/billing/packages/:id`| `JwtAuthGuard` | `ParseUUIDPipe` | `UserRole.ADMIN` | `200`, `401`, `403` | Soft-deactivates or deletes package. |
| `GET` | `/admin/billing/costs` | `JwtAuthGuard` | None | `UserRole.ADMIN` | `200`, `401`, `403` | Returns dynamic feature costs. |
| `PATCH`| `/admin/billing/costs/:key` | `JwtAuthGuard` | `UpdateCostDto` | `UserRole.ADMIN` | `200`, `401`, `403` | Updates feature credit cost with mandatory audit reason. |
| `GET` | `/admin/billing/discounts`| `JwtAuthGuard` | None | `UserRole.ADMIN` | `200`, `401`, `403` | Returns all coupons and usage statistics. |
| `POST` | `/admin/billing/discounts`| `JwtAuthGuard` | `CreateDiscountDto` | `UserRole.ADMIN` | `201`, `401`, `403` | Creates promo code with limits, expirations, and caps. |
| `PATCH`| `/admin/billing/discounts/:id`| `JwtAuthGuard` | `UpdateDiscountDto` | `UserRole.ADMIN` | `200`, `401`, `403` | Updates coupon parameters with audit reason. |
| `GET` | `/admin/billing/wallets` | `JwtAuthGuard` | Query params | `UserRole.ADMIN` | `200`, `401`, `403` | Lists user wallets with search and balance details. |
| `POST` | `/admin/billing/wallets/:id/adjust`| `JwtAuthGuard`| `AdjustCreditsDto` | `UserRole.ADMIN` | `200`, `401`, `403` | Adjusts credits (`add`, `remove`, `refund`) with mandatory reason and audit entry. |
| `GET` | `/admin/billing/transactions`| `JwtAuthGuard`| Query params | `UserRole.ADMIN` | `200`, `401`, `403` | Audits immutable global credit ledger with transaction type filters. |
| `GET` | `/admin/billing/orders` | `JwtAuthGuard` | Query params | `UserRole.ADMIN` | `200`, `401`, `403` | Lists all purchase orders and payment statuses. |
| `GET` | `/admin/billing/audit-logs`| `JwtAuthGuard`| Query params | `UserRole.ADMIN` | `200`, `401`, `403` | Reviews immutable admin audit trail (`AdminAuditLog`). |

---

### User Administration Module (`/api/users`)

| Method | Endpoint | Auth Guard | DTO Validation | Role Required | Status Codes | Audit Findings |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `GET` | `/users` | `JwtAuthGuard` | Query params | `UserRole.ADMIN` | `200`, `401`, `403` | Lists users with pagination and search. Returns role, status, and credits. |
| `PATCH`| `/users/:id/role` | `JwtAuthGuard` | `UpdateUserRoleDto`| `UserRole.ADMIN` | `200`, `401`, `403` | Updates role between `user` and `admin`. |
| `PATCH`| `/users/:id/status` | `JwtAuthGuard` | `UpdateUserStatusDto`| `UserRole.ADMIN` | `200`, `401`, `403` | Deactivates or activates user account. |
| `DELETE`| `/users/:id` | `JwtAuthGuard` | `ParseUUIDPipe` | `UserRole.ADMIN` | `200`, `401`, `403` | Deletes user record and associated relational rows. |

---

### Notifications Module (`/api/notifications`)

| Method | Endpoint | Auth Guard | DTO Validation | Status Codes | Audit Findings |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `GET` | `/notifications` | `JwtAuthGuard` | None | `200`, `401` | Returns notifications scoped strictly to `CurrentUser('id')`. |
| `PATCH`| `/notifications/:id/read`| `JwtAuthGuard`| `ParseUUIDPipe` | `200`, `401` | Marks single notification as read. |
| `POST` | `/notifications/read-all`| `JwtAuthGuard`| None | `200`, `401` | Marks all notifications for user as read. |
| `DELETE`| `/notifications/clear-all`| `JwtAuthGuard`| None | `200`, `401` | Deletes all notifications for user. |
| `DELETE`| `/notifications/:id` | `JwtAuthGuard` | `ParseUUIDPipe` | `200`, `401` | Deletes single notification for user. |

---

## 2. API Contract & Validation Consistency Findings

1. **Missing DTO Validation Pipes on Public Auth Endpoints:** `POST /auth/google` and `POST /auth/google/instant` accept raw unvalidated request bodies. These should be refactored to strongly-typed class-validator DTOs.
2. **SSRF Risk in URL Brand Extraction:** `POST /brands/extract-from-url` accepts an arbitrary URL without validating that the target is a public internet address. An attacker could pass `http://127.0.0.1:5432` or internal cloud metadata addresses (`http://169.254.169.254`).
3. **Inconsistent Error Response Shapes:** While `HttpExceptionFilter` is registered globally, some endpoints return `{ error: string, detail: string }` while standard NestJS exceptions return `{ statusCode: number, message: string | string[], error: string }`.
