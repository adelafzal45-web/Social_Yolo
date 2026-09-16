# Social Yolo — AI Post Generator: Complete Project Flow

This document describes the entire system end-to-end: how it starts, what happens
on every request, where the uploaded image physically travels, how RAG works
(read + write paths), the database, and every file's role.

---

## 1. What the project does (one paragraph)

A user types a short prompt (e.g. *"Eid sale post with 50% discount"*) and optionally
uploads a product photo (e.g. a bag). The backend removes the photo's background,
uses **RAG on two axes** to find reference posts — **text** (the user's own
highly-rated past posts plus a global sample pool, compared via Gemini text
embeddings) and **images** (past post graphics compared visually via CLIP, so a
typed prompt can find posts that *look* like what is wanted) — builds a full
"designer-style" prompt from those references, then calls an image generation
engine to produce one finished social-media post image. The result is stored on
disk + in Postgres, and its image is embedded too, so the pool grows with every
generation. The user rates the result (1–5★); ratings of 4–5 feed the post back
into both RAG pools, so future generations match the user's taste.

## 2. Architecture at a glance

```
┌──────────────────────┐
│ post-tester.html     │  Browser test UI (served by Nest at /post-tester.html)
│ (Backend/public)     │  prompt + optional file + x-user-id header
└──────────┬───────────┘
           │ multipart/form-data
┌──────────▼─────────────────────────────────┐
│ NestJS Backend  (http://localhost:3000)    │
│  /api/posts/generate   /api/posts/:id/rate │
│  /api/image-processing/health              │
│  Swagger: /api/docs                        │
│                                            │
│  PostGeneratorService (orchestrator)       │
│   ├─ ImageProcessingService ───────────────┼──► Python microservice :8000
│   ├─ RAG text: Embeddings → Retriever      │    (FastAPI: rembg bg-removal
│   │   RAG image: ImageEmbeddings →         │     + CLIP: /embed-image,
│   │     Retriever → PromptBuilder          │     /embed-text, /embedding-health)
│   ├─ GeminiService ────────────────────────┼──► Google Gemini API
│   └─ PollinationsService (fallback) ───────┼──► pollinations.ai (free)
└──────────┬─────────────────────────────────┘
           │ TypeORM
┌──────────▼─────────────────────────────────┐
│ PostgreSQL  database: "Social Yolo"        │
│  tables: posts, post_embeddings,           │
│          post_image_embeddings             │
│  TWO vector stores (real[], cosine in      │
│  Node): post_embeddings = Gemini TEXT      │
│  vectors 768d · post_image_embeddings =    │
│  CLIP image/text vectors 512d              │
└────────────────────────────────────────────┘
```

Three processes must run: Postgres, the Python service (port 8000), the NestJS
backend (port 3000). Generated images live under `Backend/public/generated-posts/`,
and the seeded past designs under `Backend/public/reference-posts/` (both served
statically from `Backend/public`).

## 3. Startup flow (`npm run start:dev`)

1. `src/main.ts` — **first line** `import './config/env'` loads `Backend/.env`
   into `process.env` before any config is read.
2. `NestFactory.create(AppModule)` boots the app:
   - CORS whitelist (`CORS_ORIGINS` env or defaults for the Vite dev ports),
   - global `ValidationPipe` (whitelist + transform),
   - **global prefix `api`** → all routes live under `/api/...`,
   - static assets from `Backend/public` (serves the tester page and the
     generated post images),
   - Swagger UI at `/api/docs`.
3. `AppModule` wires up:
   - `TypeOrmModule.forRoot(databaseConfig)` — connects to Postgres
     (`DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME`), registers the three
     entities (`Post`, `PostEmbedding`, `PostImageEmbedding`);
      `synchronize: true` auto-creates the
     tables if missing.
   - `ImageProcessingModule`, `PostsModule`, `PostGeneratorModule`.
4. `app.listen(process.env.PORT ?? 3000, '0.0.0.0')`.

## 4. Generation flow — the life of one request

`POST /api/posts/generate` (multipart: `prompt`, optional `file`, header `x-user-id`)

**Step 0 — Browser** (`public/post-tester.html`): builds `FormData` with the prompt
and the selected file, sends with the `x-user-id` header.

**Step 1 — Rate limit** (`post-generator/rate-limit.service.ts`):
`RateLimitService.consume(userId)` — sliding window of `POSTGEN_RATE_LIMIT` (10)
attempts per user per `POSTGEN_RATE_WINDOW_MIN` (60) minutes. Exceeded → HTTP 429.
In-memory (resets on restart); counted per attempt, even failed ones.

**Step 2 — Subject image journey** (`post-generator.service.ts` →
`image-processing/image-processing.service.ts`):

```
browser file
  → multer (memory) → UploadedFile.buffer
  → ImageProcessingService.processImageWithStatus(file)
      → HTTP multipart POST to Python :8000/process-image (timeout 180 s)
      → image-service/image_processor.py:
            PIL open → RGBA
            rembg.remove()            (model: birefnet-general-lite, ~36 s CPU)
            sharpness 1.2, contrast 1.05 (RGB only, alpha untouched)
            → transparent PNG bytes
      → on Python down/error: returns ORIGINAL bytes, backgroundRemoved=false
  → Buffer → base64 string (subjectBase64)
  → log: "Subject image attached (~N KB, background removed)"
```

Note: the image is only read when `IMAGE_PROVIDER=gemini`. In `pollinations`
mode the file is intentionally dropped (text-to-image cannot use it).

**Step 3 — RAG read path** (see §6): embed the short prompt on BOTH axes →
retrieve top text style references (Gemini space) AND top image style references
(CLIP space) → `PromptBuilderService.buildFinalPrompt()` merges everything into
the final designer brief. Logged as "Final prompt sent to <engine>". Each axis
degrades independently — if CLIP is unavailable only the image references are lost.

**Step 4 — Image generation** (`post-generator.service.ts` step 3):

- **Gemini path** (`gemini.service.ts`, model `GEMINI_IMAGE_MODEL` =
  `gemini-2.5-flash-image` aka "Nano Banana"): the request contents are
  `[ your photo (inlineData), up to 2 retrieved style-reference images
  (inlineData), final prompt (text) ]` — **images first**, because
  editing models anchor better on a reference that precedes the text. The
  reference images are the top matches from the image-side RAG pool (past
  posts that LOOK like the request). The prompt demands the subject appear
  EXACTLY as photographed (never substituted) and a PHOTOREALISTIC result
  (no cartoon/anime/illustration).
- **Automatic fallback**: any Gemini failure (today: 429 quota, free tier has
  `limit: 0`) logs a warning and retries with `PollinationsService` — a free
  text-to-image endpoint (3 attempts, 4 s apart). Fallback designs contain the
  style hints but **not** the uploaded photo.
- `usedProvider` records which engine actually produced the image.

**Step 5 — Persistence** (`posts/posts.service.ts` + disk):
`createPost()` inserts the `posts` row (gets a uuid) → the PNG/JPEG is written
to `Backend/public/generated-posts/<uuid>.<ext>` → `post.imagePath` is updated
to `generated-posts/<uuid>.<ext>`. Static serving makes it reachable at
`/<imagePath>`. Finally the generated image itself is CLIP-embedded into
`post_image_embeddings` with `source: 'generated'` (NOT retrieved until rated
≥ 4 — see §7), so the image pool grows automatically with every generation.

**Step 6 — Response** to the browser:
`{ id, imageUrl, userPrompt, finalPrompt, rating: null, engine: usedProvider, createdAt }`.
The tester shows the image plus an honest engine note
("your uploaded photo was used" vs "⚠️ fallback: photo was NOT used").

## 5. Where the uploaded image physically goes (summary)

| Setting | Path of your photo |
|---|---|
| `IMAGE_PROVIDER=gemini`, Gemini OK | multer buffer → Python rembg (bg removed) → base64 → **inside the Gemini request** → appears in the design |
| `IMAGE_PROVIDER=gemini`, Python down | multer buffer → (skip rembg, original bytes) → base64 → inside the Gemini request |
| `IMAGE_PROVIDER=gemini`, Gemini 429 | photo is prepared… then **thrown away** by the fallback to Pollinations |
| `IMAGE_PROVIDER=pollinations` | photo is **dropped immediately** (before any engine call) |

Today the observed 429 (`limit: 0`, no image quota on the free tier) means every
generation falls back to Pollinations — the single reason uploads never appear in
posts. Fix: enable billing on the Google AI Studio project (no code changes needed).

## 6. RAG — read path (runs on every generation)

Files: `rag/embeddings.service.ts`, `rag/image-embeddings.service.ts`,
`rag/retriever.service.ts`, `rag/prompt-builder.service.ts`

1. `EmbeddingsService.embedText(userPrompt)` — Gemini `gemini-embedding-001`,
   `outputDimensionality: 768`. In-memory cache (200 entries), key =
   sha256(`model:dims:text`) so identical prompts never re-hit the API.
2. `RetrieverService.retrieveStyleContext(userId, queryEmbedding)` — loads **all**
   `post_embeddings` rows (with the `post` relation), computes **cosine similarity
   in Node** (no pgvector installed — the embedding column is plain `real[]`;
   acceptable at this corpus size). Then:
   - up to **2** from the user's own pool (`source='user'`, same `userId`,
     `post.rating >= 4`),
   - up to **3** from the global pool (`source='sample'`),
   each returned as `RetrievedStyle { postId, userPrompt, contentText, source, similarity }`.
3. `PromptBuilderService.buildFinalPrompt()` — Gemini engine: a structured designer
   brief (role → user prompt → numbered style references (≤220 chars each) →
   attached reference-image instructions → subject-exactness instruction (varies
   with `backgroundRemoved`) → photorealism requirements). Pollinations engine: a
   compact single-line prompt (style hints ≤140 chars). All RAG steps degrade
   gracefully — any failure logs a warning and generation continues without
   references.

### Image-side retrieval (CLIP) — the visual axis

The text pipeline above only knows captions. To retrieve posts by their actual
LOOK, a parallel pipeline runs on every generation (`post-generator.service.ts`):

1. `ImageEmbeddingsService.embedQuery(userPrompt)` — POSTs the prompt to the
   Python service `/embed-text`, which encodes it with the CLIP **text**
   encoder (`clip-ViT-B-32`, 512 dims, unit-normalized). In-memory cached.
2. `RetrieverService.retrieveImageContext(userId, queryEmbedding, model)` —
   loads all `post_image_embeddings` rows (with the `post` relation), keeps
   only rows produced by the SAME CLIP `model` (different model = different
   space), computes cosine in Node, then takes up to **2** user rows
   (`source='user'`, same user, `rating >= 4`) and up to **3** sample rows
   (`source='sample'`), each as
   `RetrievedImageStyle { postId, imagePath, userPrompt, source, similarity }`.
   A post is returned at most once; `generated` rows are never retrieved
   directly (they enter the pools via rating).
3. The prompt builder turns these into "match this visual style" instructions,
   and the top **2** reference images are attached to the Gemini call
   (`referenceImages`, loaded from `public/<imagePath>`; missing files are
   skipped). Pollinations cannot see images, so there the reference briefs are
   only mentioned as text.

Never mix the two vector spaces: Gemini 768d text vectors
(`post_embeddings`) and CLIP 512d vectors (`post_image_embeddings`) are
incompatible — the retrievers filter by `model` to keep this true.

## 7. RAG — write path (the feedback loop)

`POST /api/posts/:id/rate` with `{ rating: 1..5 }` + `x-user-id`
(`feedback.service.ts`, threshold `RATING_POOL_THRESHOLD = 4`):

- Ownership: the post's `userId` is set to the existing owner, else the first
  rater claims it.
- **rating ≥ 4** → contentText = `"<userPrompt> — <finalPrompt>"` →
  `embedText(contentText)` → upsert into `post_embeddings`
  (`source: 'user'`, `styleMetadata: { ratedAt, rating }`). The post's IMAGE is
  also CLIP-embedded (read from `public/<imagePath>`) into
  `post_image_embeddings` as a separate `source: 'user'` row — the earlier
  `generated` row is kept for history; the retriever deduplicates per post.
  The post is now retrievable style for this user on BOTH axes.
- **rating ≤ 3** → any existing personal-pool rows for that post (text AND
  image) are **deleted**.
- Global samples use the same tables with `source: 'sample'` (seeded via
  `scripts/seed-sample-posts.cjs` for text and
  `scripts/seed-image-posts.cjs` for images).

## 8. Database schema (Postgres, `synchronize: true`)

**posts** — `id uuid PK`, `user_id text NULL` (NULL = global sample),
`image_path text`, `user_prompt text`, `final_prompt text NULL`,
`rating int NULL`, `created_at`, `updated_at`.

**post_embeddings** — `id uuid PK`, `post_id uuid FK → posts (ON DELETE CASCADE,
OneToOne)`, `content_text text` (the exact text that was embedded),
`source text` ('user' | 'sample'), `embedding real[]` (768 floats from
`gemini-embedding-001`), `style_metadata jsonb NULL`, `created_at`.

**post_image_embeddings** — `id uuid PK`, `post_id uuid FK → posts (ON DELETE
CASCADE, ManyToOne — a post can carry both a `generated` and later a `user`
row)`, `image_path text` (the image file this vector represents, relative to
`Backend/public`), `source text` ('user' | 'sample' | 'generated'),
`model text` (the CLIP model, e.g. `clip-ViT-B-32`), `dims int` (512),
`embedding real[]`, `style_metadata jsonb NULL`, `created_at`.

The vector stores *are* the two `embedding real[]` columns; upgrading to pgvector
means installing the extension, changing the columns to `vector(768)` /
`vector(512)` and replacing the in-app cosine with `<=>` SQL queries (documented
in the entity comments).

## 9. File map

| File | Role |
|---|---|
| `Backend/src/main.ts` | Bootstrap: env, CORS, prefix `api`, static `public/`, Swagger, listen 3000 |
| `Backend/src/config/env.ts` | Loads `.env` first (imported as main.ts's first line) |
| `Backend/src/config/database.config.ts` | TypeORM Postgres config + entity registration |
| `Backend/src/config/image-service.config.ts` | Python service URL + timeout |
| `Backend/src/app.module.ts` | Root module wiring all feature modules |
| `Backend/src/post-generator/post-generator.controller.ts` | `POST /api/posts/generate`, `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts/:id/rate` |
| `Backend/src/post-generator/post-generator.service.ts` | Orchestrator: bg-removal → RAG → engine → persist; fallback logic lives here |
| `Backend/src/post-generator/gemini.service.ts` | Gemini image call (image-first contents, exactness prompt) |
| `Backend/src/post-generator/providers/pollinations.service.ts` | Free fallback engine (3 retries / 4 s) |
| `Backend/src/post-generator/rate-limit.service.ts` | 10 gen/hour per user (in-memory) |
| `Backend/src/post-generator/feedback.service.ts` | Rating → personal style pools (text + image) upsert/delete |
| `Backend/src/post-generator/rag/embeddings.service.ts` | Gemini embeddings (768d) + cache |
| `Backend/src/post-generator/rag/retriever.service.ts` | Loads rows, in-app cosine; `retrieveStyleContext` (text) + `retrieveImageContext` (CLIP), top-2 user + top-3 sample each |
| `Backend/src/post-generator/rag/prompt-builder.service.ts` | Final prompts (designer brief / compact) |
| `Backend/src/post-generator/rag/image-embeddings.service.ts` | Client for Python CLIP `/embed-image`, `/embed-text`, `/embedding-health` (+ prompt cache, MIME helper) |
| `Backend/src/posts/entities/post-image-embedding.entity.ts` | `post_image_embeddings` table entity (the IMAGE vector store) |
| `Backend/scripts/seed-image-posts.cjs` | Seeds the image pool from a folder of past designs (CLIP + optional Gemini vision captions → both tables) |
| `image-service/clip_encoder.py` | CLIP wrapper: images + text → shared 512d space (lazy model load) |
| `image-service/warmup_clip.py` | Preloads/downloads the CLIP model once after service start |
| `Backend/src/posts/entities/post.entity.ts` | `posts` table entity |
| `Backend/src/posts/entities/post-embedding.entity.ts` | `post_embeddings` table entity (the TEXT vector store) |
| `Backend/scripts/seed-sample-posts.cjs` | Seeds the global TEXT sample pool (10 hand-written style descriptions) |
| `Backend/src/posts/posts.service.ts` | Data access for posts + both embedding tables |
| `Backend/src/image-processing/image-processing.controller.ts` | `POST /api/image-processing` (+ `/health`) |
| `Backend/src/image-processing/image-processing.service.ts` | Proxy to Python; returns `{ buffer, backgroundRemoved }` |
| `image-service/main.py` | FastAPI: `POST /process-image`, `GET /` (health), `GET /embedding-health`, `POST /embed-image`, `POST /embed-text` |
| `image-service/image_processor.py` | rembg bg-removal + sharpness/contrast → PNG |
| `Backend/public/post-tester.html` | Browser UI: generate, engine badge, star ratings |
| `Backend/public/generated-posts/` | Output images (`<uuid>.png`) |
| `Backend/public/reference-posts/` | Copies of the seeded past designs (used as style references) |
| `Backend/.env` | DB creds, `GEMINI_API_KEY`, model names, `IMAGE_PROVIDER`, limits |

## 10. External services & failure behavior

| Dependency | Used for | On failure |
|---|---|---|
| Gemini `gemini-embedding-001` | text embeddings (RAG) | RAG skipped, generation continues |
| Gemini `gemini-2.5-flash-image` | post image WITH the subject photo | → automatic Pollinations fallback (photo lost) |
| pollinations.ai | free text-to-image fallback | 3 attempts (4 s apart); 502 only if all fail |
| Python :8000 (rembg) | background removal | original bytes used, prompt adjusted ("keep subject as-is") |
| Python :8000 (CLIP) | image + prompt embeddings (visual RAG) | image-side RAG skipped (warn), generation continues |
| Postgres | posts + embeddings | hard requirement (TypeORM) |

## 11. Current state & known limitations

- **Gemini image quota = 0** (free tier): every generation falls back to
  Pollinations, which **cannot include the uploaded photo** (and cannot SEE the
  attached style-reference images either — their briefs are still used as text).
  Enabling billing on the Google AI Studio project activates the full pipeline
  instantly — no code changes required.
- No real auth yet — identity is the `x-user-id` header (first rater claims a post).
- Rate limiter is in-memory; fine for a single instance.
- No pgvector — cosine computed in Node for BOTH vector stores (acceptable at
  this corpus size).
- CLIP model = `clip-ViT-B-32` (CPU, 512d): fast and good for style matching.
  A stronger option is ViT-L/14 (768d) via `CLIP_MODEL` in `.env` — but changing
  the model orphans existing `post_image_embeddings` rows (re-run
  `seed-image-posts.cjs --force` after switching).
- Fallback posts are honestly labeled via the `engine` field in responses and UI.

## 12. How to run

```powershell
# 1. Postgres must be running with database "Social Yolo" (.env: DB_* vars)
# 2. Python bg-removal service:
cd Social_Yolo\image-service
uvicorn main:app --host 0.0.0.0 --port 8000
# 3. Backend:
cd Social_Yolo\Backend
npm install
npm run start:dev        # http://localhost:3000, Swagger at /api/docs
# 4. Seed the image-style pool from past designs (one-time; the first run
#    downloads the CLIP model ~600 MB, then embeds every image and — by
#    default — writes Gemini vision captions into the text pool too):
cd Social_Yolo\Backend
node scripts/seed-image-posts.cjs            # default: ..\Social Media Posts
#    options: "D:\path\to\folder" | --force | --no-describe | --limit N
#    If a run was interrupted by Gemini rate limits (free tier), just re-run
#    it WITHOUT --force: already-embedded images are skipped, caption-less
#    ones are re-processed until every image has a caption.
# 5. Open the tester:
#    http://localhost:3000/post-tester.html
```

Optional env overrides: `IMAGE_PROVIDER` (gemini|pollinations),
`GEMINI_IMAGE_MODEL`, `GEMINI_EMBEDDING_MODEL`, `GEMINI_EMBEDDING_DIMENSIONS`,
`GEMINI_TEXT_MODEL` (vision captions in `seed-image-posts.cjs`),
`CLIP_MODEL` (Python side; default `clip-ViT-B-32`),
`IMAGE_SERVICE_MODEL` (rembg model: `birefnet-general-lite` quality vs
`isnet-general-use` speed), `POSTGEN_RATE_LIMIT`, `POSTGEN_RATE_WINDOW_MIN`.



