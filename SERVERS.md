# Running the two servers

| Server | What it is | Port | Start command |
|---|---|---|---|
| `image-service` | Python FastAPI + rembg background-removal microservice (`image-service/main.py`) | **8000** | `uvicorn main:app --host 0.0.0.0 --port 8000` |
| `backend` | NestJS API that proxies to `image-service` (`Backend/`) | **3000** | `npm run start:dev` (watch) or `npm run start:prod` (build) |

Start `image-service` **first** - the backend calls it for every processed image
(see `Backend/.env`: `IMAGE_SERVICE_URL=http://localhost:8000`).

## Option A - manually, in two terminals (foreground)

**Terminal 1 - Python image service:**

```powershell
cd d:\TechnoQ_AI\Social_Yolo\image-service
..\.venv\Scripts\Activate.ps1          # use the project virtualenv
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - NestJS backend (open a second terminal):**

```powershell
cd d:\TechnoQ_AI\Social_Yolo\Backend
npm run start:dev                      # watch mode (auto-reload on save)
# without watch:
npm start
# from the compiled build:
npm run build
npm run start:prod
```

Stop each one with **Ctrl+C** in its terminal.

Plain `cmd.exe` variant (no venv activation needed):

```bat
:: Terminal 1
cd /d d:\TechnoQ_AI\Social_Yolo\image-service
..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

:: Terminal 2
cd /d d:\TechnoQ_AI\Social_Yolo\Backend
npm run start:dev
```

## Option B - background via `servers.ps1` (recommended)

```powershell
cd d:\TechnoQ_AI\Social_Yolo

.\servers.ps1 start                 # start both in the background, wait until healthy
.\servers.ps1 status                # pids, ports, health
.\servers.ps1 health                # probe both health endpoints
.\servers.ps1 logs image-service    # last 40 lines of out + err logs
.\servers.ps1 logs backend -Tail 80
.\servers.ps1 logs backend -Follow  # stream the log like tail -f (Ctrl+C to exit)
.\servers.ps1 restart               # restart both
.\servers.ps1 restart backend       # restart one service
.\servers.ps1 stop                  # stop both (kills the whole process tree)
.\servers.ps1 stop backend
.\servers.ps1 cleanup               # stop + delete pid files and logs
.\servers.ps1 start -Prod           # backend from dist build instead of watch mode
```

Details:

- PID files live in `.run\` (`image-service.pid`, `backend.pid`).
- Logs: `image-service\uvicorn_out.log` / `uvicorn_err.log` and
  `Backend\nest_out.log` / `nest_err.log` (overwritten on each start).
- `start` waits until both health endpoints answer, then reports the recorded PIDs.
- `stop` uses `taskkill /PID <pid> /T /F`, so the whole `npm -> nest -> node` tree dies.
- If the script reports a service as *started outside servers.ps1*, it found the
  port occupied by a process it did not launch; stop that one with Ctrl+C or
  `taskkill /PID <pid> /T /F`.

## Verifying it all works

| URL | Expect |
|---|---|
| http://localhost:8000/ | `{"message": "Image processing service is running"}` |
| http://localhost:3000/api | backend root route |
| http://localhost:3000/api/image-processing/health | backend -> python wiring check |
| http://localhost:3000/api/docs | Swagger UI for the API |

Command-line smoke test once both are up (uses `127.0.0.1` + `--noproxy` on
purpose - on some Windows setups, loopback requests that go through the
system proxy stack stall, e.g. PowerShell 5.1's `Invoke-WebRequest` with
`localhost`; `servers.ps1 status` / `health` already handle this):

```bat
curl.exe --noproxy "*" http://127.0.0.1:8000/
curl.exe --noproxy "*" http://127.0.0.1:3000/api/image-processing/health
```

Full pipeline test (backend -> python -> rembg) with the bundled sample photo:

```bat
curl.exe --noproxy "*" -F "file=@d:\TechnoQ_AI\Social_Yolo\image-service\sample_photo.jpg" http://127.0.0.1:3000/api/image-processing/remove-background
```

Returns JSON with the processed PNG as base64 (`bytes`) plus a ready-to-use
data URL (`url`). The first call loads the AI model and can take a while.

## Troubleshooting

- **Port already in use** - find the owner and kill it:
  ```powershell
  Get-NetTCPConnection -LocalPort 3000,8000 -State Listen
  taskkill /PID <pid> /T /F
  ```
- **Backend won't start** - check `Backend\nest_err.log`.
- **Python service won't start** - check `image-service\uvicorn_err.log`;
  missing deps: `..\.venv\Scripts\python.exe -m pip install -r requirements.txt`.
- **Execution policy blocks the script** -
  `powershell -ExecutionPolicy Bypass -File .\servers.ps1 status`.
- **Loopback URLs time out in your own scripts/browser** - use `127.0.0.1`
  instead of `localhost` (the services bind IPv4 `0.0.0.0`), and bypass any
  system proxy for loopback (`curl.exe --noproxy "*"`). `servers.ps1` already
  probes with a direct connection.
