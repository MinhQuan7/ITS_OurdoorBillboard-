# restart.ps1 - Script to restart Electron app cleanly
Write-Host "Killing all Electron processes..." -ForegroundColor Yellow
taskkill /f /im electron.exe 2>$null

Write-Host "Waiting 2 seconds..." -ForegroundColor Yellow  
Start-Sleep 2

Write-Host "Starting application..." -ForegroundColor Green
npm run dev