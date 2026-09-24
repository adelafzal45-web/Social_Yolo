# Social Yolo — Next.js Studio Frontend

Production Next.js (App Router) interface for Social Yolo's AI-powered background removal and alpha-matte refinement engine.

## Features
- **4-Stage Workflow**: Authentication (RBAC) -> Image Upload -> Live Matting Status -> Side-by-Side Result Studio.
- **Visual Alpha Inspection**: Interactive checkerboard transparent preview for edge detail and halo inspection.
- **Deep Quality Diagnostics**: Real-time verdict badge, foreground coverage %, transition-band %, mid-alpha haze %, min/max alpha, and stages applied.
- **Automated Fallback Transparency**: Displays provider chain execution and fallback flags.
- **Zero-CORS Same-Origin Proxy**: Next.js rewrites proxy `/api/*` requests directly to `${BACKEND_ORIGIN}` (`http://localhost:3000` by default).

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server on port 3001:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   npm run start
   ```

## Pre-configured Test Accounts (RBAC)
- **Administrator**: `admin@socialyolo.local` / `Admin@123`
- **Content Creator**: `creator@socialyolo.local` / `Creator@123`
- **Restricted User (RBAC Denial Test)**: `restricted@socialyolo.local` / `User@123`

## Configuration and validation

Copy .env.example to .env.local to override BACKEND_ORIGIN, then restart/rebuild Next.js.
Start the backend from Backend with npm run start:dev on port 3000, and the frontend
with npm run dev on port 3001. The existing backend /image-tester.html remains available.
Run npm run typecheck and npm run build for frontend verification, and npm test in Backend.

Medium is bundled and offline. The installed IMG.LY package does not bundle a large model;
large requests require IMGLY_LARGE_PUBLIC_PATH on the backend, pointing to a compatible
HTTPS asset directory with a /models/large entry in resources.json. No user image is sent
to that asset host. BRIA requests do send the image to the configured BRIA service.

Quality metrics describe the model mask before refinement. Coverage and opaque fraction
use total image pixels; transition and haze use nonzero-alpha subject pixels; opaque
border uses perimeter pixels. These are structural heuristics, not proof of visual quality.
POSSIBLE_REMNANT and LOW_CONFIDENCE never trigger a second model. EMPTY_SUBJECT and
NO_REMOVAL can trigger BRIA when configured. providerChain records attempted providers;
fallbackUsed means the BRIA result was selected. A failed/tied fallback retains the primary.

To reproduce the legacy PNG path, set BG_REFINE_ENABLED=false, BG_ANALYSIS_ENABLED=false,
and BG_FALLBACK_ENABLED=false before starting the backend. Feathering defaults off and
uses a fixed three-tap kernel when enabled. Its color ring is filled before alpha changes.

Manual acceptance: log in with creator, upload JPEG/PNG/WebP, inspect both previews and
quality metrics, and download the PNG. Log in with restricted to verify the permission
error; an expired token should return to login. Inspect hair, fur, jewelry/wires, complex
backgrounds, similar foreground/background colors, low-resolution images, existing
transparency, and inputs above 2560 pixels. Real-photo quality and live BRIA fallback
require representative fixtures and a configured provider; synthetic tests do not replace them.

### Verification recorded 2026-09-13

- Backend: 61 tests passed across 8 suites; TypeScript check passed.
- Frontend: production build and TypeScript check passed.
- Live requests through port 3001: creator/restricted login 200; missing/invalid token 401;
  restricted upload 403; medium-model JPEG processing 200 with RGBA PNG, quality report,
  decontaminate/alpha-curve stages, and a single IMG.LY provider in about 5.3 seconds.
- Backend legacy tester and providers endpoint returned 200.
- Native Sharp synthetic checks passed: transition RGB becomes foreground RGB while
  alpha remains 128, grayscale decodes to four channels, and kill-switch bytes match
  the unchanged postprocessing path exactly.
- Pending: interactive browser flow (browser tool timed out), the full 14-scenario
  photographic acceptance matrix, live BRIA fallback, and a configured large-model
  download. The sample retains fine-edge mask artifacts; an OK structural verdict
  should not be interpreted as certification that all hair/edge detail is correct.
