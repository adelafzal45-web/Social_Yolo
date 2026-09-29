# Social Yolo AI — Security, Privacy & Multi-Tenancy Isolation Audit

**Author:** Security Auditor & Senior Software Architect  
**Date:** September 29, 2026  
**Status:** Comprehensive Vulnerability Assessment & Threat Model  
**Standards Referenced:** OWASP Top 10 (2021), NIST SP 800-63B, CWE Top 25

---

## 1. Threat Modeling & Vulnerability Summary

| Vulnerability ID | Title | OWASP / CWE Category | Severity | CVSS v3.1 | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **VULN-SEC-01** | Raw `x-user-id` Header Trust & Admin Fallback | CWE-287 / Broken Access Control | **CRITICAL** | `9.8` | **Confirmed Defect** |
| **VULN-SEC-02** | Unauthenticated Post Generation Billing Bypass | CWE-306 / Missing Authentication | **CRITICAL** | `9.1` | **Confirmed Defect** |
| **VULN-SEC-03** | Next.js Proxy Cache Cross-User Data Leakage | CWE-524 / Information Disclosure | **CRITICAL** | `8.8` | **Confirmed Defect** |
| **VULN-SEC-04** | Unsigned Payment Confirmation Webhook Forgery | CWE-345 / Insufficient Verification | **CRITICAL** | `9.4` | **Confirmed Defect** |
| **VULN-SEC-05** | Unauthenticated Public Static Asset Exposure | CWE-200 / Information Exposure | **HIGH** | `7.5` | **Confirmed Defect** |
| **VULN-SEC-06** | Missing Edge Middleware on Protected Routes | CWE-284 / Improper Access Control | **HIGH** | `7.1` | **Confirmed Defect** |
| **VULN-SEC-07** | Password Reset Token Lack of Email Dispatch | CWE-640 / Weak Password Recovery | **HIGH** | `6.8` | **Confirmed Defect** |
| **VULN-SEC-08** | SSRF Risk in Website Brand Extraction | CWE-918 / SSRF | **MEDIUM** | `6.5` | **Confirmed Defect** |
| **VULN-SEC-09** | Global Entity Favorite Flag Mutation | CWE-639 / IDOR / Integrity | **MEDIUM** | `5.3` | **Confirmed Defect** |
| **VULN-SEC-10** | Permissive Instant Google Login in Non-Prod | CWE-288 / Auth Bypass | **MEDIUM** | `6.0` | **Confirmed Defect** |

---

## 2. In-Depth Vulnerability Analysis

---

### VULN-SEC-01: Raw `x-user-id` Header Trust & Admin Fallback in Brands API
- **Affected File:** [`Social_Yolo_BE/Backend/src/brands/brands.controller.ts#L32-L71`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/brands/brands.controller.ts)
- **CWE:** CWE-287: Improper Authentication, CWE-639: Authorization Bypass Through User-Controlled Key
- **Code Evidence:**
  ```typescript
  private async resolveUserId(req: Request, headerUserId?: string): Promise<string> {
    if (headerUserId && headerUserId.trim()) {
      return headerUserId.trim(); // <--- VULNERABILITY 1: Unverified Client Header
    }
    // ... JWT checks ...
    // Fallback: If unauthenticated, use the primary admin/system user to guarantee foreign key integrity
    const admin = await this.usersService.findByEmail(process.env.ADMIN_EMAIL || 'admin@socialyolo.com');
    if (admin) {
      return admin.id; // <--- VULNERABILITY 2: Automatic Admin Elevation
    }
  }
  ```
- **Impact:**
  1. An attacker can set `x-user-id: <victim_user_id>` in their request headers to read, update, or delete the Brand DNA profiles of any user on the platform.
  2. If an attacker sends no token and no header, the backend automatically logs them in as the primary system administrator (`admin@socialyolo.com`), granting full access to the admin's private Brand DNA profiles.
- **Reproduction Steps:**
  1. Send `GET /api/brands` with header `x-user-id: 00000000-0000-0000-0000-000000000001`.
  2. Observe that the API returns the target user's brand profile without verifying ownership.
  3. Send `GET /api/brands` with no headers at all. Observe that the API returns the admin user's brand profiles.

---

### VULN-SEC-02: Unauthenticated AI Generation Billing Bypass
- **Affected File:** [`Social_Yolo_BE/Backend/src/post-generator/post-generator.controller.ts#L89-L165`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/post-generator/post-generator.controller.ts) and [`post-generator.service.ts#L141-L155`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/post-generator/post-generator.service.ts)
- **CWE:** CWE-306: Missing Authentication for Critical Function
- **Code Evidence:**
  ```typescript
  // post-generator.controller.ts (createGuided has NO @UseGuards(JwtAuthGuard))
  const userId = this.resolveUserId(req); // Returns null if no token is sent!
  return this.postGeneratorService.generateGuidedPost(dto, uniqueProductFiles, userId, ...);

  // post-generator.service.ts
  if (userId) {
    await this.billingService.deductCredits(userId, totalCreditsCost, ...);
  }
  ```
- **Impact:** An attacker can make direct API calls to `/api/posts/create-guided` without sending an authorization header. The backend executes expensive multi-variant Gemini 2.5 Flash generations for free, bypassing all credit deductions.
- **Reproduction Steps:**
  1. Send `POST /api/posts/create-guided` with multipart form data (`prompt="Luxury watch campaign"`) without an `Authorization` header or cookie.
  2. The generation proceeds to completion, Gemini API generates the image, and 0 credits are deducted.

---

### VULN-SEC-03: Next.js Proxy Cache Cross-User Data Leakage
- **Affected File:** [`social-yolo-frontend/src/app/api/proxy/[...path]/route.ts#L16-L64`](file:///c:/Users/HH%20T/Desktop/Social-yolo/social-yolo-frontend/src/app/api/proxy/%5B...path%5D/route.ts)
- **CWE:** CWE-524: Use of Cache Containing Sensitive Information
- **Code Evidence:**
  ```typescript
  function getCacheKey(req: NextRequest, path: string, queryString: string): string {
    const userId = req.headers.get('x-user-id') || 'anon';
    const auth = req.headers.get('authorization') ? 'auth' : 'noauth';
    return `${userId}:${auth}:${path}${queryString}`;
  }

  // Caching GET responses:
  const skipCache = ['auth', 'billing', 'notifications'].includes(effectiveParts[0]);
  if (isGet && response.status === 200 && !skipCache) {
    proxyCache.set(cacheKey, ...);
  }
  ```
- **Impact:**
  `posts` and `brands` are NOT in `skipCache`!
  When User A navigates to `/dashboard/brands`, the browser makes a GET request via the proxy without the optional `x-user-id` header.
  The proxy caches the response under the key: `anon:auth:brands`.
  When User B navigates to `/dashboard/brands` within the next 15 seconds, the proxy matches `anon:auth:brands` and returns User A's private brand DNA to User B!
- **Reproduction Steps:**
  1. User A logs in and visits `/dashboard/brands`.
  2. Within 15 seconds, User B logs in on another browser and visits `/dashboard/brands`.
  3. User B sees User A's brand name, website URL, colors, and logos.

---

### VULN-SEC-04: Unsigned Payment Confirmation Webhook Forgery
- **Affected File:** [`Social_Yolo_BE/Backend/src/billing/billing.controller.ts#L113-L131`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/billing/billing.controller.ts)
- **CWE:** CWE-345: Insufficient Verification of Data Authenticity
- **Code Evidence:**
  ```typescript
  @Post('webhook')
  async paymentWebhook(
    @Body() dto: WebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    if (!dto.orderId) {
      return { received: true, ignored: true, reason: 'Missing orderId' };
    }
    return this.billingService.confirmPayment(dto.orderId, dto.paymentReference || `WH-${Date.now()}`, ...);
  }
  ```
- **Impact:**
  Any user can inspect their network tab during checkout to observe their pending order ID (e.g. `order-xyz`).
  The user can then issue a `POST /api/billing/webhook` with `{ "orderId": "order-xyz", "paymentReference": "WH-FAKE" }`.
  The backend immediately marks the order as `COMPLETED` and credits their wallet with 5000 credits without receiving real payment.

---

### VULN-SEC-05: Unauthenticated Public Static Asset Exposure
- **Affected File:** [`Social_Yolo_BE/Backend/src/main.ts#L63-L71`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/main.ts)
- **CWE:** CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
- **Code Evidence:**
  ```typescript
  app.useStaticAssets(resolve(process.cwd(), 'public'), {
    prefix: '/api/',
    index: false,
  });
  ```
- **Impact:** All user uploads (product prototypes, confidential patent photos, brand logos) stored in `Backend/public/uploads` and all generated marketing posts in `Backend/public/generated-posts` are directly accessible without authentication to anyone on the internet.

---

### VULN-SEC-07: Password Reset Lack of Email Delivery
- **Affected File:** [`Social_Yolo_BE/Backend/src/auth/auth.service.ts#L112-L143`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/auth/auth.service.ts)
- **CWE:** CWE-640: Weak Password Recovery Mechanism
- **Code Evidence:**
  In `forgotPassword`, a token is generated and saved to the database:
  ```typescript
  const isProd = process.env.NODE_ENV === 'production';
  return {
    message: genericMessage,
    ...(isProd ? {} : { devToken: rawToken, resetUrl }),
  };
  ```
- **Impact:** In production mode, the API omits `devToken` for security, but because there is **no email transporter / SMTP integration**, the reset link is never sent to the user's email address. Users who forget their passwords cannot regain access to their accounts.

---

### VULN-SEC-08: Server-Side Request Forgery (SSRF) in Brand Extraction
- **Affected File:** [`Social_Yolo_BE/Backend/src/brands/brands.service.ts`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/brands/brands.service.ts)
- **CWE:** CWE-918: Server-Side Request Forgery (SSRF)
- **Impact:** `POST /api/brands/extract-from-url` takes a URL from the user and makes an HTTP request to fetch metadata. If a user submits `http://169.254.169.254/latest/meta-data/` or `http://localhost:5432`, the backend server attempts to connect to internal services.
- **Recommended Fix:** Enforce a strict domain validator restricting protocols to `http:` and `https:`, and disallowing private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`).
