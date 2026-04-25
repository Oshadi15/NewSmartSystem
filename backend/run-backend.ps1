param(
    [int]$Port = 8081
)

$ErrorActionPreference = "Stop"

Write-Host "Checking for existing process on port $Port..."

$existingPids = @(
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
)

foreach ($procId in $existingPids) {
    if ($procId -and $procId -ne $PID) {
        Write-Host "Stopping process $procId on port $Port..."
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

$env:SERVER_PORT = "$Port"
Write-Host "Starting backend on port $Port..."
.\mvnw spring-boot:run
