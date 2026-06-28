# Axon gene AI Local Server Starter
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Axon gene AI Local Server Starter" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kill existing server process on port 8000
Write-Host "[1/3] Checking for existing server on port 8000..." -ForegroundColor Yellow
$connection = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($connection) {
    Write-Host "Found existing server process (PID $($connection.OwningProcess)). Terminating it..." -ForegroundColor Red
    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 2. Open browser
Write-Host "[2/3] Opening application in default browser..." -ForegroundColor Yellow
Start-Process "http://127.0.0.1:8000"

# 3. Start server
Write-Host "[3/3] Launching Uvicorn server..." -ForegroundColor Yellow
Write-Host ""
& .venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
