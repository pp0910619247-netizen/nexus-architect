# Nexus - Deploy NEX Token + JobBoard (ตลาดงาน escrow 10%)
# Run: powershell -ExecutionPolicy Bypass -File deploy-market.ps1
# Private key is asked on screen and NEVER saved anywhere.

Write-Host "=== Nexus - Deploy NEX Token + JobBoard ===" -ForegroundColor Yellow
Write-Host "Expected wallet: 0x74CD6E9a955fD2339F4e746B083a9e7D6845E7a4"
Write-Host ""

$sec = Read-Host "Paste Private Key (hidden input)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$plain = $plain.Trim().Trim('"').Trim("'")
if ($plain -notmatch '^0x' -and $plain -match '^[0-9a-fA-F]{64}$') { $plain = "0x" + $plain }
if ($plain -notmatch '^0x[0-9a-fA-F]{64}$') {
    Write-Host "[ERROR] Invalid key format." -ForegroundColor Red
    exit 1
}

$env:PRIVATE_KEY = $plain
$plain = $null
Write-Host ""
Write-Host "Deploying NexusToken + JobBoard..." -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot
npx hardhat run deploy-jobboard.js --network amoy

Remove-Item Env:\PRIVATE_KEY -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "DONE - copy nexus_token + job_board addresses above and send them back" -ForegroundColor Green
