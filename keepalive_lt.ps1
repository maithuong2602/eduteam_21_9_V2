while ($true) {
    Write-Host "Starting localtunnel..."
    npx localtunnel --port 3000
    Write-Host "Localtunnel closed, restarting in 2 seconds..."
    Start-Sleep -Seconds 2
}
