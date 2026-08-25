# TRAIN NIGHT - overnight brain training (ASCII-safe for PS 5.1)
# Run: powershell -ExecutionPolicy Bypass -File TRAIN_NIGHT.ps1          (default 6h)
#      powershell ... -Hours 3
param([double]$Hours = 6)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $root 'tools\train_night.mjs') --hours $Hours
Write-Host "DONE - open tools\TRAINING_REPORT.md and tools\BEST_CONFIG.json"
