# Nexus Architect - Deploy to Polygon Amoy (one-click)
# Run: powershell -ExecutionPolicy Bypass -File deploy-amoy.ps1
# The private key is asked on screen and NEVER saved anywhere.

Write-Host "=== Nexus Architect - Deploy to Amoy Testnet ===" -ForegroundColor Yellow
Write-Host "Expected wallet: 0x74CD6E9a955fD2339F4e746B083a9e7D6845E7a4"
Write-Host "(must be the private key of THIS wallet only)"
Write-Host ""

$sec = Read-Host "Paste Private Key (hidden input)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

# normalize: trim spaces/quotes, add 0x prefix if missing (MetaMask exports without 0x)
$plain = $plain.Trim().Trim('"').Trim("'")
if ($plain -notmatch '^0x' -and $plain -match '^[0-9a-fA-F]{64}$') { $plain = "0x" + $plain }

if ($plain -notmatch '^0x[0-9a-fA-F]{64}$') {
    Write-Host "[ERROR] Invalid key format. Must be 64 hex chars, with or without 0x prefix." -ForegroundColor Red
    exit 1
}

$env:PRIVATE_KEY = $plain
$plain = $null
Write-Host ""
Write-Host "Deploying... (1-2 minutes)" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot
npx hardhat run deploy.js --network amoy

Remove-Item Env:\PRIVATE_KEY -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "DONE - copy the 2 contract addresses above into nexus.config.toml" -ForegroundColor Green
