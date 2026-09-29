# Social Yolo AI — Automated Test Suite & QA Verification Report

**Author:** QA Lead & Security Auditor  
**Date:** September 29, 2026  
**Test Framework:** Jest v30.0.0 via `ts-jest` v29.2.5  
**Runtime:** Node.js v20+ / Windows 10/11 x64  
**Total Tests Executed:** 17  
**Total Passed:** 17  
**Total Failed:** 0  
**Execution Duration:** 6.436s

---

## 1. Test Execution Summary

```
PASS src/auth/jwt.service.spec.ts
PASS src/billing/pricing.service.spec.ts
PASS src/billing/billing.service.spec.ts

Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        6.436 s
Ran all test suites.
```

---

## 2. Granular Unit Test Breakdown

### 1. Token Service (`src/auth/jwt.service.spec.ts`)
- `[PASS]` **Valid Payload Signing & Verification:** Verifies that a user payload (`sub`, `email`, `role`, `name`) signed by the token service produces a valid JWT string and decodes to match all fields identically.
- `[PASS]` **Invalid Token Rejection:** Verifies that malformed, corrupted, or tampered tokens throw `UnauthorizedException`.

### 2. Centralized Pricing Service (`src/billing/pricing.service.spec.ts`)
- `[PASS]` **Base Price Resolution:** Verifies that requesting a package without a promo code returns the exact base price with `isValidCoupon: false`.
- `[PASS]` **Missing Package Guard:** Verifies that requesting a non-existent package ID throws `NotFoundException`.
- `[PASS]` **Percentage Discount Application:** Verifies that a 25% discount on a $20 package calculates `discountAmount = 5.0` and `finalPrice = 15.0`.
- `[PASS]` **Fixed Discount & Floor Cap:** Verifies that a $30 fixed coupon on a $20 package caps discount at $20 and sets `finalPrice = 0.0`.
- `[PASS]` **Maximum Discount Cap Enforcement:** Verifies that a 50% discount with a $15 cap on a $100 package applies only $15 discount (`finalPrice = 85.0`).
- `[PASS]` **Minimum Spend Validation:** Verifies that a coupon with a $50 minimum purchase requirement is rejected on a $20 package.
- `[PASS]` **Per-User Redemption Limit:** Verifies that a one-time promo code is rejected when the user has already reached their redemption limit.

### 3. Billing & Wallet Service (`src/billing/billing.service.spec.ts`)
- `[PASS]` **Deduction Zero/Negative Guard:** Verifies that attempting to deduct 0 or negative credits throws `BadRequestException`.
- `[PASS]` **Insufficient Credit Block:** Verifies that attempting to deduct 10 credits from a wallet containing 5 credits throws `BadRequestException` ("Insufficient credits").
- `[PASS]` **Atomic Deduction & Ledger Entry:** Verifies that deducting 5 credits from a 20-credit wallet decrements balance to 15, increments `totalUsed`, updates `users.credits`, and creates an immutable ledger row (`amount = -5`).
- `[PASS]` **Refund Zero Guard:** Verifies that attempting to refund 0 credits exits early without altering wallet.
- `[PASS]` **Atomic Credit Refund:** Verifies that refunding 5 credits increments balance to 20, increments `totalRefunded`, updates `users.credits`, and records a transaction of type `REFUND`.
- `[PASS]` **Admin Adjustment Reason Mandatory:** Verifies that an admin credit adjustment without an explicit reason is rejected with `BadRequestException`.
- `[PASS]` **Admin Debit Limit Protection:** Verifies that an admin cannot debit more credits than a user currently possesses.
- `[PASS]` **Admin Credit Adjustment & Audit Logging:** Verifies that adding credits updates the user's wallet and creates an audit log entry in `admin_audit_logs`.

---

## 3. Test Coverage Gaps & Untested Critical Paths

| Module / Layer | Current Test Status | Risk Level | Specific Gaps |
| :--- | :---: | :---: | :--- |
| **`post-generator.controller.ts`** | ❌ Untested | **HIGH** | No tests verifying that unauthenticated calls are rejected. |
| **`brands.controller.ts`** | ❌ Untested | **HIGH** | No tests checking `x-user-id` header spoofing or admin fallback. |
| **`image-processing.service.ts`** | ❌ Untested | **MEDIUM** | No tests for ONNX timeout, 2.5MB large file bypass, or Redis failover. |
| **`auth.controller.ts`** | ❌ Untested | **MEDIUM** | No controller-level tests for registration validation, login cookies, or reset tokens. |
| **End-to-End (E2E) Flow** | ❌ Untested | **HIGH** | No automated E2E tests tracing login -> wizard -> generation -> wallet balance update. |
| **Frontend Component Tests** | ❌ Untested | **MEDIUM** | No Jest/React Testing Library specs for `PostGenerator.tsx` or billing modals. |

---

## 4. Quality Assurance Recommendations

1. **Implement Controller Auth Tests:** Add integration tests for all controller routes asserting that requests without valid JWTs receive HTTP `401 Unauthorized`.
2. **Add Concurrency Hammer Test:** Write an automated test simulating 10 simultaneous threads attempting to deduct credits from a single-balance wallet to verify that the PostgreSQL `FOR UPDATE` lock strictly prevents overdrafts.
3. **E2E Playwright Suite:** Introduce a lightweight Playwright test validating login, studio navigation, and credit display.
