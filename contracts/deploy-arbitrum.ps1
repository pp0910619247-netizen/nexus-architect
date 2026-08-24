# Nexus Architect - Deploy to Arbitrum Sepolia (Q4: mainnet-beta prep)
# Run: powershell -ExecutionPolicy Bypass -File deploy-arbitrum.ps1
# The private key is asked on screen and NEVER saved anywhere.
# Faucet ETH: https://faucets.chain.link/arbitrum-sepolia (or alchemy)

Write-Host "=== Nexus Architect - Deploy to Arbitrum Sepolia ===" -ForegroundColor Yellow

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

Set-Location $PSScriptRoot
npx hardhat run deploy.js --network arbitrumSepolia

Remove-Item Env:\PRIVATE_KEY -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "DONE - explorer: https://sepolia.arbiscan.io - update nexus.config.toml + app/index.html" -ForegroundColor Green
