# Test the full image pipeline with any image from your PC.
#
# Usage (from any terminal):
#   powershell -ExecutionPolicy Bypass -File D:\TechnoQ_AI\Social_Yolo\Backend\test-pipeline.ps1 -ImagePath "C:\path\to\your\photo.jpg"
#
# The processed (transparent) PNG is saved next to your original file
# as processed_<yourfilename>.png

param(
    [Parameter(Mandatory = $true)]
    [string]$ImagePath,

    [string]$ApiUrl = "http://localhost:3000/api/image-processing/remove-background"
)

if (-not (Test-Path $ImagePath)) {
    Write-Host "ERROR: file not found: $ImagePath" -ForegroundColor Red
    exit 1
}

Write-Host "Sending '$ImagePath' to $ApiUrl ..." -ForegroundColor Cyan

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$raw = curl.exe -s -X POST -F "file=@$ImagePath" $ApiUrl
$stopwatch.Stop()

if (-not $raw) {
    Write-Host "ERROR: no response. Is the NestJS server running on port 3000?" -ForegroundColor Red
    exit 1
}

$response = $raw | ConvertFrom-Json

if (-not $response.bytes) {
    Write-Host "ERROR: unexpected response: $raw" -ForegroundColor Red
    exit 1
}

$name = [IO.Path]::GetFileNameWithoutExtension($ImagePath)
$dir = Split-Path $ImagePath -Parent
$outPath = Join-Path $dir ("processed_" + $name + ".png")

[IO.File]::WriteAllBytes($outPath, [Convert]::FromBase64String($response.bytes))

Write-Host "Done in $([math]::Round($stopwatch.Elapsed.TotalSeconds, 1))s" -ForegroundColor Green
Write-Host "Processed image saved to: $outPath" -ForegroundColor Green
Write-Host "Open it - the background should be transparent (checkerboard in most viewers)."
