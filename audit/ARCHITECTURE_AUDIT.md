# Social Yolo AI — System Architecture Audit

**Author:** Senior Software Architect & AI Systems Engineer  
**Date:** September 29, 2026  
**Status:** Complete Read-Only Architectural Review  
**Target Repositories:** `social-yolo-frontend`, `Social_Yolo_BE/Backend`, `Social_Yolo_BE/image-service`

---

## 1. System Topology & Component Overview

The Social Yolo AI platform is structured as a decoupled multi-tier architecture consisting of three primary runtimes, a relational database, and an optional in-memory data store:

```mermaid
graph TB
    subgraph CLIENT_TIER["Client Tier"]
        Browser["End-User Browser (Desktop / Mobile)"]
    end

    subgraph FRONTEND_TIER["Frontend Tier (Next.js 14 - Port 3000)"]
        NextServer["Next.js Node Server"]
        AppRouter["App Router (SSR & Client Bundles)"]
        ProxyRoute["API Proxy Route (/api/proxy/[...path])"]
        ProxyCache["In-Memory Proxy Cache (LRU Map)"]
        NextServer --> AppRouter
        NextServer --> ProxyRoute
        ProxyRoute <--> ProxyCache
    end

    subgraph BACKEND_TIER["Backend Tier (NestJS 11 - Port 3001)"]
        NestApp["NestJS Core Application"]
        AuthMod["AuthModule (JWT / Bcrypt / Google OAuth)"]
        PostMod["PostGeneratorModule (Prompt Engine / Art Director)"]
        BillingMod["BillingModule (Wallets / Pricing / Pessimistic Locks)"]
        ImgMod["ImageProcessingModule (@imgly ONNX Engine)"]
        BrandMod["BrandsModule (Scraping / Brand DNA)"]
        NotifMod["NotificationsModule"]
        
        NestApp --> AuthMod
        NestApp --> PostMod
        NestApp --> BillingMod
        NestApp --> ImgMod
        NestApp --> BrandMod
        NestApp --> NotifMod
    end

    subgraph EXTERNAL_SERVICES["External Cloud AI Providers"]
        GeminiAPI["Google Gemini API (gemini-2.5-flash & imagen)"]
        PollinationsAPI["Pollinations.ai (Fallback Image Generator)"]
    end

    subgraph DATA_TIER["Data & Cache Tier"]
        Postgres[("PostgreSQL 18 DB (Social Yolo)")]
        RedisCache[("Redis (Optional - Cache & Job Queue)")]
    end

    subgraph PYTHON_TIER["Auxiliary Python Service (Port 8000 - Standalone)"]
        FastAPI["FastAPI / Uvicorn (rembg + rapidocr)"]
    end

    Browser <--> NextServer
    ProxyRoute <--> NestApp
    PostMod <--> GeminiAPI
    PostMod <--> PollinationsAPI
    ImgMod <--> PythonTier["FastAPI (Optional Microservice)"]
    NestApp <--> Postgres
    NestApp <--> RedisCache
```

---

## 2. End-to-End User Workflow & Data Tracing

### Workflow: Prompt Submission to Generation, Storage, and Settlement

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant UI as Studio UI (PostGenerator.tsx)
    participant Proxy as Next.js Proxy (/api/proxy)
    participant Nest as PostGeneratorController
    participant Billing as BillingService (TypeORM)
    participant DB as PostgreSQL (Social Yolo)
    participant Gemini as Google Gemini API
    participant Disk as Local File System (Backend/public)

    User->>UI: Selects Brand, Platform, Style, & Clicks "Generate My Post"
    UI->>UI: Pre-flight credit check (credits >= variations * 5)
    UI->>Proxy: POST /api/proxy/posts/create-guided (Multipart Form)
    Proxy->>Nest: Forward request to POST /api/posts/create-guided
    Nest->>Nest: resolveUserId(req) - Extracts JWT Bearer or Cookie
    
    rect rgb(240, 248, 255)
        note right of Nest: Step 1: Credit Reservation
        Nest->>Billing: deductCredits(userId, totalCost, "AI Post Generation")
        Billing->>DB: BEGIN TRANSACTION
        Billing->>DB: SELECT * FROM wallets WHERE userId = :id FOR UPDATE
        Billing->>DB: UPDATE wallets SET currentBalance = currentBalance - cost
        Billing->>DB: INSERT INTO credit_transactions (amount = -cost, ...)
        Billing->>DB: UPDATE users SET credits = newBalance
        Billing->>DB: COMMIT TRANSACTION
    end

    rect rgb(255, 250, 240)
        note right of Nest: Step 2: Asset Storage & Art Direction
        Nest->>Disk: Write uploaded product photo to Backend/public/uploads/orig-UUID.png
        Nest->>Gemini: models.generateContent (Marketing Copy & Two-Stage Art Prompt)
        Gemini-->>Nest: Returns Headline, Body Copy, CTA, & Image Generation Prompt
    end

    rect rgb(240, 255, 240)
        note right of Nest: Step 3: High-Definition Image Synthesis
        Nest->>Gemini: models.generateContent (imageModel: gemini-2.5-flash-image)
        Gemini-->>Nest: Returns Generated Image Base64 Bytes
        Nest->>Disk: Write output image to Backend/public/generated-posts/post-UUID.png
    end

    rect rgb(255, 245, 245)
        note right of Nest: Step 4: Ledger & Variant Persistence
        Nest->>DB: INSERT INTO posts (userId, imagePath, headline, bodyCopy, ...)
        Nest-->>Proxy: Return PostResponseDto (201 Created)
        Proxy-->>UI: Return 201 Created with JSON
        UI->>User: Display High-Definition Post Result & Trigger Confetti
    end

    alt Failure in Generation Downstream
        Nest->>Billing: refundCredits(userId, totalCost, "Generation Failure")
        Billing->>DB: BEGIN TRANSACTION (FOR UPDATE)
        Billing->>DB: UPDATE wallets SET currentBalance = currentBalance + cost
        Billing->>DB: INSERT INTO credit_transactions (type = REFUND)
        Billing->>DB: COMMIT
        Nest-->>UI: 502 Bad Gateway / Error Toast
    end
```

---

## 3. Inter-Service Communication & Failure Modes

### 1. Frontend-to-Backend Relay (`/api/proxy/[...path]`)
- **Protocol:** HTTP/1.1 REST over local reverse proxy.
- **Implementation:** [`social-yolo-frontend/src/app/api/proxy/[...path]/route.ts`](file:///c:/Users/HH%20T/Desktop/Social-yolo/social-yolo-frontend/src/app/api/proxy/%5B...path%5D/route.ts).
- **Design Intent:** Eliminate CORS restrictions and prevent exposing internal backend port numbers (3001) to browser clients.
- **Architectural Defects Identified:**
  - **In-Memory Caching Race Condition:** The proxy implements a custom in-memory LRU cache (`proxyCache`) with a 15-second TTL. The cache key generator relies on `x-user-id` header (`req.headers.get('x-user-id') || 'anon'`). Because the browser client rarely sets `x-user-id` explicitly (relying on `Authorization: Bearer <token>`), multiple authenticated users share the identical cache key: `anon:auth:<path>`.
  - **Single Failure Impact:** A server restart or crash of the Next.js process evicts all in-flight streaming operations.

### 2. NestJS Background Removal Queue (`BackgroundRemovalQueueService`)
- **Protocol:** Dual-mode Hybrid: Redis List/PubSub if Redis is reachable; In-Memory EventEmitter & bounded queue if Redis is offline.
- **Implementation:** [`Social_Yolo_BE/Backend/src/image-processing/background-removal-queue.service.ts`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/image-processing/background-removal-queue.service.ts).
- **Concurrency Control:** Hardcoded `maxConcurrency = 2`.
- **Architectural Safeguards:**
  - File size cutoff at 2.5MB: If an uploaded image exceeds 2.5MB, in-process ONNX inference is bypassed (`passthrough-large-asset`) to prevent Node.js V8 heap out-of-memory crashes.
  - 15-second execution timeout using `Promise.race()` to prevent thread starvation.
- **Failure Mode:** If both native ONNX and Redis fail, the service gracefully falls back to returning the original image buffer without crashing the HTTP pipeline.

### 3. Gemini AI Provider Integration (`GeminiService`)
- **SDK:** Official `@google/genai` v2.21.0.
- **Implementation:** [`Social_Yolo_BE/Backend/src/post-generator/gemini.service.ts`](file:///c:/Users/HH%20T/Desktop/Social-yolo/Social_Yolo_BE/Backend/src/post-generator/gemini.service.ts).
- **Models Configured:**
  - Text & Planning: `gemini-2.5-flash`
  - Image Synthesis: `models/gemini-2.5-flash-image` (fallback to Pollinations.ai if Gemini fails or is unconfigured)
  - Embedding: `gemini-embedding-001`
- **Failure Mode:** If Gemini API rate limits (429) or throws 503, the service catches the error, logs a warning, and falls back to deterministic rule-based marketing copy templates and Pollinations.ai image generation.

---

## 4. Single Points of Failure (SPOF) & Resilience Analysis

| Component | Redundancy | SPOF Risk | Impact of Failure | Recommended Mitigation |
| :--- | :---: | :---: | :--- | :--- |
| **PostgreSQL Database** | None (Single node) | **HIGH** | Complete platform downtime; auth, billing, and post creation fail immediately. | Implement managed PostgreSQL with multi-AZ failover and automated point-in-time recovery (PITR). |
| **Local Disk Storage (`Backend/public`)** | None | **CRITICAL** | Asset loss upon container restart, pod reschedule, or deployment. | Replace local disk writes with Amazon S3 / Cloudflare R2 / Google Cloud Storage with CDN signed URLs. |
| **NestJS Backend Node Process** | Single instance | **MEDIUM** | Event loop lockup during heavy image decoding freezes API for all users. | Cluster backend using PM2 or Kubernetes multi-replica deployments behind an ALB / NGINX reverse proxy. |
| **Gemini API Quota** | Single API Key | **MEDIUM** | HTTP 429 quota exhaustion blocks AI generation platform-wide. | Implement quota monitoring, exponential backoff with jitter, and multi-key / multi-provider fallback pools. |
| **In-Memory Cache (Proxy & Node)** | Memory-bound | **LOW** | Cache invalidation leaks or cache loss upon restart. | Migrate all distributed cache keys to Redis with strict tenant namespaces. |

---

## 5. Architectural Recommendations

1. **Decouple Asset Storage from Application Container:** Refactor `PostGeneratorService` and `PostsService` to upload generated images and user assets directly to an S3-compatible bucket rather than writing to `process.cwd() + '/public'`.
2. **Eliminate Next.js In-Memory API Proxy Caching:** Remove `proxyCache` from `route.ts`. Let HTTP cache headers (`Cache-Control: private, no-store`) govern client caching, and delegate API caching strictly to Redis on the backend.
3. **Migrate Vector Retrieval to pgvector:** Replace in-memory cosine similarity computation over `this.embeddingRepo.find()` with native PostgreSQL `pgvector` indexing (`HNSW` / `IVFFlat`).
