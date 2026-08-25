# TRAIN NIGHT — เทรน AI ทั้งคืน (6-8 ชม.)
# Run: powershell -ExecutionPolicy Bypass -File TRAIN_NIGHT.ps1
param([double]$Hours = 6)
node (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'tools\train_night.mjs') --hours $Hours
Write-Host "`nDONE — open tools\TRAINING_REPORT.md + tools\BEST_CONFIG.json"
