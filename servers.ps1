<#
.SYNOPSIS
  Manage the two local servers of the Social_Yolo project.

  Services
    image-service : FastAPI/uvicorn background-removal microservice (port 8000)
    backend       : NestJS API that proxies to image-service      (port 3000)

.EXAMPLE
  .\servers.ps1 start                 # start both in the background, wait until healthy
  .\servers.ps1 status                # show pid / port / health
  .\servers.ps1 health                # probe both health endpoints
  .\servers.ps1 logs image-service    # tail the uvicorn log
  .\servers.ps1 logs backend -Tail 80 # more lines
  .\servers.ps1 logs backend -Follow  # stream the log like tail -f (Ctrl+C to stop)
  .\servers.ps1 restart backend       # restart one service
  .\servers.ps1 stop                  # stop both (kills the whole process tree)
  .\servers.ps1 cleanup               # stop both + delete pid files and logs

.NOTES
  The backend runs in dev/watch mode (npm run start:dev) by default.
  Add -Prod to run the compiled build instead (node dist/main.js).
  If scripts are blocked on your machine, run:
    powershell -ExecutionPolicy Bypass -File .\servers.ps1 <action>
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'health', 'logs', 'cleanup')]
    [string]$Action = 'status',

    [Parameter(Position = 1)]
    [ValidateSet('image-service', 'backend', 'all')]
    [string]$Name = 'all',

    # Backend only: run the compiled build (node dist/main.js) instead of the dev watcher
    [switch]$Prod,

    # logs action: number of lines to show
    [int]$Tail = 40,

    # logs action: keep streaming the log (like tail -f)
    [switch]$Follow
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # keep Invoke-WebRequest quiet

$Root       = $PSScriptRoot
$RunDir     = Join-Path $Root '.run'
$BackendDir = Join-Path $Root 'Backend'
$ImageDir   = Join-Path $Root 'image-service'
$VenvPython = Join-Path $Root '.venv\Scripts\python.exe'

$Services = [ordered]@{
    'image-service' = @{
        Dir        = $ImageDir
        PidFile    = Join-Path $RunDir 'image-service.pid'
        OutLog     = Join-Path $ImageDir 'uvicorn_out.log'
        ErrLog     = Join-Path $ImageDir 'uvicorn_err.log'
        Port       = 8000
        HealthUrl  = 'http://127.0.0.1:8000/'
        ProcNames  = @('python')
        StartOrder = 1
    }
    'backend' = @{
        Dir        = $BackendDir
        PidFile    = Join-Path $RunDir 'backend.pid'
        OutLog     = Join-Path $BackendDir 'nest_out.log'
        ErrLog     = Join-Path $BackendDir 'nest_err.log'
        Port       = 3000
        HealthUrl  = 'http://127.0.0.1:3000/api/image-processing/health'
        ProcNames  = @('cmd', 'node')
        StartOrder = 2
    }
}

$script:HadError = $false

function Get-Targets {
    if ($Name -eq 'all') { return @($Services.Keys) }
    return @($Name)
}

function Test-Healthy([string]$Url) {
    # Uses HttpWebRequest with Proxy = $null on purpose: Invoke-WebRequest in
    # Windows PowerShell 5.1 routes through the system (WinINET) proxy, which
    # breaks loopback checks when a proxy is configured on the machine.
    try {
        $req = [System.Net.HttpWebRequest]::Create($Url)
        $req.Method = 'GET'
        $req.Timeout = 5000
        $req.ReadWriteTimeout = 5000
        $req.Proxy = $null
        $resp = $req.GetResponse()
        $code = [int]$resp.StatusCode
        $resp.Close()
        return ($code -ge 200 -and $code -lt 300)
    }
    catch { return $false }
}

function Get-PortOwnerPid([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($conn) { return [int]$conn.OwningProcess }
    return $null
}

function Get-ManagedPid($Svc) {
    if (-not (Test-Path $Svc.PidFile)) { return $null }
    $storedId = Get-Content $Svc.PidFile -ErrorAction SilentlyContinue
    if (-not $storedId) { return $null }
    $proc = Get-Process -Id $storedId -ErrorAction SilentlyContinue
    if (-not $proc) { return $null }
    if ($Svc.ProcNames -notcontains $proc.ProcessName) {
        Write-Host ("  [warn] pid {0} from {1} is now a '{2}' process - pid file looks stale" -f $storedId, $Svc.PidFile, $proc.ProcessName) -ForegroundColor Yellow
        return $null
    }
    return [int]$proc.Id
}

function Start-One([string]$Key) {
    $svc = $Services[$Key]

    if (Test-Healthy $svc.HealthUrl) {
        Write-Host ("  {0}: already healthy on port {1} - nothing to do" -f $Key, $svc.Port) -ForegroundColor DarkGray
        return
    }

    if (-not (Test-Path $RunDir)) { New-Item -ItemType Directory -Path $RunDir -Force | Out-Null }

    if ($Key -eq 'image-service') {
        Write-Host ("  {0}: starting uvicorn (logs: {1})..." -f $Key, $svc.OutLog)
        $proc = Start-Process -FilePath $VenvPython `
            -ArgumentList '-m uvicorn main:app --host 0.0.0.0 --port 8000' `
            -WorkingDirectory $svc.Dir -WindowStyle Hidden `
            -RedirectStandardOutput $svc.OutLog -RedirectStandardError $svc.ErrLog -PassThru
    }
    elseif ($Prod) {
        Write-Host ("  {0}: starting node dist/main.js (logs: {1})..." -f $Key, $svc.OutLog)
        $proc = Start-Process -FilePath 'node.exe' `
            -ArgumentList 'dist/main.js' `
            -WorkingDirectory $svc.Dir -WindowStyle Hidden `
            -RedirectStandardOutput $svc.OutLog -RedirectStandardError $svc.ErrLog -PassThru
    }
    else {
        Write-Host ("  {0}: starting npm run start:dev (logs: {1})..." -f $Key, $svc.OutLog)
        $proc = Start-Process -FilePath 'cmd.exe' `
            -ArgumentList '/c npm run start:dev' `
            -WorkingDirectory $svc.Dir -WindowStyle Hidden `
            -RedirectStandardOutput $svc.OutLog -RedirectStandardError $svc.ErrLog -PassThru
    }

    Set-Content -Path $svc.PidFile -Value $proc.Id -Encoding ASCII
    Write-Host ("  {0}: launched with pid {1} (recorded in .run/{0}.pid)" -f $Key, $proc.Id)
}

function Wait-Healthy([string]$Key, [int]$TimeoutSec) {
    $svc = $Services[$Key]
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-Healthy $svc.HealthUrl) {
            Write-Host ''
            Write-Host ("  {0}: healthy   {1}" -f $Key, $svc.HealthUrl) -ForegroundColor Green
            return $true
        }
        Write-Host '.' -NoNewline
        Start-Sleep -Milliseconds 800
    }
    Write-Host ''
    Write-Host ("  {0}: NOT healthy after {1}s - see {2}" -f $Key, $TimeoutSec, $svc.ErrLog) -ForegroundColor Red
    return $false
}

function Stop-One([string]$Key) {
    $svc = $Services[$Key]
    $procId = Get-ManagedPid $svc
    $foundViaPort = $false
    if (-not $procId) { $procId = Get-PortOwnerPid $svc.Port; $foundViaPort = $true }

    if (-not $procId) {
        Write-Host ("  {0}: not running" -f $Key) -ForegroundColor DarkGray
        if (Test-Path $svc.PidFile) { Remove-Item $svc.PidFile -Force }
        return
    }

    $procName = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
    if ($procName -and $svc.ProcNames -notcontains $procName) {
        Write-Host ("  {0}: port {1} is held by '{2}' (pid {3}) - not a {0} process, leaving it alone" -f $Key, $svc.Port, $procName, $procId) -ForegroundColor Yellow
        if (Test-Path $svc.PidFile) { Remove-Item $svc.PidFile -Force }
        return
    }

    Write-Host ("  {0}: stopping pid {1}{2} (taskkill /T /F)..." -f $Key, $procId, $(if ($foundViaPort) { ' [found via port]' }))
    & taskkill.exe /PID $procId /T /F 2>&1 | Out-Null
    Start-Sleep -Milliseconds 700

    if (Get-PortOwnerPid $svc.Port) {
        Write-Host ("  {0}: WARNING - port {1} is still in use" -f $Key, $svc.Port) -ForegroundColor Red
        $script:HadError = $true
    }
    else {
        Write-Host ("  {0}: stopped, port {1} free" -f $Key, $svc.Port) -ForegroundColor Green
    }
    if (Test-Path $svc.PidFile) { Remove-Item $svc.PidFile -Force }
}

function Show-StatusLine([string]$Key) {
    $svc = $Services[$Key]
    $procId = Get-ManagedPid $svc
    $tag = 'managed by servers.ps1'
    if (-not $procId) {
        $procId = Get-PortOwnerPid $svc.Port
        $tag = 'started outside servers.ps1'
    }

    if ($procId) {
        $healthy = Test-Healthy $svc.HealthUrl
        Write-Host ("  {0,-14} RUNNING  pid={1,-6} port={2,-5} health={3}  [{4}]" -f $Key, $procId, $svc.Port, $(if ($healthy) { 'OK' } else { 'FAIL' }), $tag) -ForegroundColor $(if ($healthy) { 'Green' } else { 'Yellow' })
    }
    else {
        Write-Host ("  {0,-14} STOPPED  port={1} free" -f $Key, $svc.Port) -ForegroundColor DarkGray
    }
}

function Invoke-StartAll {
    $targets = Get-Targets | Sort-Object { $Services[$_].StartOrder }
    foreach ($key in $targets) { Start-One $key }
    foreach ($key in $targets) {
        $timeout = 60; if ($key -eq 'backend') { $timeout = 120 }
        if (-not (Wait-Healthy $key $timeout)) { $script:HadError = $true }
    }
}

function Invoke-Health {
    foreach ($key in (Get-Targets)) {
        $svc = $Services[$key]
        try {
            $req = [System.Net.HttpWebRequest]::Create($svc.HealthUrl)
            $req.Method = 'GET'
            $req.Timeout = 8000
            $req.ReadWriteTimeout = 8000
            $req.Proxy = $null
            $resp = $req.GetResponse()
            $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $body = $reader.ReadToEnd()
            $reader.Close()
            $code = [int]$resp.StatusCode
            $resp.Close()
            if ($body -and $body.Length -gt 120) { $body = $body.Substring(0, 120) + '...' }
            Write-Host ("  {0,-14} OK   {1}  HTTP {2}  {3}" -f $key, $svc.HealthUrl, $code, ($body -replace '\s+', ' ')) -ForegroundColor Green
        }
        catch {
            Write-Host ("  {0,-14} FAIL {1}  ({2})" -f $key, $svc.HealthUrl, $_.Exception.Message) -ForegroundColor Red
            $script:HadError = $true
        }
    }
}

function Invoke-Logs {
    $keys = @(Get-Targets)
    if ($keys.Count -gt 1) {
        Write-Host '  Choose one service, e.g.:  .\servers.ps1 logs image-service   /   .\servers.ps1 logs backend'
        return
    }
    $svc = $Services[$keys[0]]
    foreach ($file in @($svc.OutLog, $svc.ErrLog)) {
        if (-not (Test-Path $file)) { continue }
        if ((Get-Item $file).Length -eq 0) { continue }
        Write-Host ("  ---- {0} ----" -f $file)
        if ($Follow) { Get-Content $file -Tail $Tail -Wait }
        else { Get-Content $file -Tail $Tail }
    }
}

function Invoke-Cleanup {
    foreach ($key in (@($Services.Keys) | Sort-Object { $Services[$_].StartOrder } -Descending)) {
        Stop-One $key
    }
    foreach ($key in @($Services.Keys)) {
        $svc = $Services[$key]
        foreach ($file in @($svc.OutLog, $svc.ErrLog)) {
            if (Test-Path $file) { Remove-Item $file -Force; Write-Host ("  removed log {0}" -f $file) -ForegroundColor DarkGray }
        }
    }
    if (Test-Path $RunDir) { Remove-Item $RunDir -Recurse -Force; Write-Host ("  removed {0}" -f $RunDir) -ForegroundColor DarkGray }
    Write-Host '  cleanup done' -ForegroundColor Green
}

Write-Host ("== servers.ps1: {0} {1} ==" -f $Action, $Name)

switch ($Action) {
    'start'   { Invoke-StartAll }
    'stop'    { foreach ($k in (@(Get-Targets) | Sort-Object { $Services[$_].StartOrder } -Descending)) { Stop-One $k } }
    'restart' {
        foreach ($k in (@(Get-Targets) | Sort-Object { $Services[$_].StartOrder } -Descending)) { Stop-One $k }
        Invoke-StartAll
    }
    'status'  { foreach ($k in (Get-Targets)) { Show-StatusLine $k } }
    'health'  { Invoke-Health }
    'logs'    { Invoke-Logs }
    'cleanup' { Invoke-Cleanup }
}

if ($script:HadError) { exit 1 }
