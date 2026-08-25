# AUTORUN NIGHT WATCH - Nexus Architect (ASCII-safe for PS 5.1)
# Run: powershell -ExecutionPolicy Bypass -File AUTORUN_NIGHT.ps1          (default 12h)
#      powershell ... -Hours 8

param([int]$Hours = 12)
$ErrorActionPreference = 'Continue'
$root     = Split-Path -Parent $MyInvocation.MyCommand.Path
$report   = Join-Path $root 'MORNING_REPORT.md'
$deadline = (Get-Date).AddHours($Hours)
$site     = 'https://pp0910619247-netizen.github.io/nexus-architect/'
$rpc      = 'https://polygon-amoy-bor-rpc.publicnode.com'
$nexAddr  = '0x999dec3a199335e0a83d0Dc03d8d0ABB48542035'
$presale  = '0x8b6EC8d481A583d788B9C9d2c914E9bc0a220e24'
$jobs     = '0xD6CA3267356f91E3c43097adf8F02caFa42D358A'

"## MORNING REPORT - generated $(Get-Date)" | Out-File $report -Encoding utf8
"Watch every 15min until $deadline" | Out-File $report -Append -Encoding utf8

function Check-Site($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    return "OK $($r.StatusCode)"
  } catch { return "DOWN: $($_.Exception.Message)" }
}
function ChainCall($to, $data) {
  $body = @{ jsonrpc='2.0'; id=1; method='eth_call';
             params=@(@{to=$to; data=$data}, 'latest') } | ConvertTo-Json -Depth 5
  try {
    $r = Invoke-RestMethod -Uri $rpc -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 20
    if ($r.result) { return ([bigint]$r.result).ToString() } else { return 'ERR' }
  } catch { return "ERR" }
}

$i = 0
while ((Get-Date) -lt $deadline) {
  $i++
  $ts = Get-Date -Format 'HH:mm:ss'

  $s1 = Check-Site $site
  $s2 = Check-Site "$site/waitlist.html"
  $sup   = ChainCall $nexAddr '0x18160ddd'   # totalSupply()
  $raise = ChainCall $presale '0xe3d470ad'   # totalRaised()
  $jc    = ChainCall $jobs    '0x61bc04db'   # jobCount()

  $tests = '-'
  if ($i % 4 -eq 1) {
    Push-Location (Join-Path $root 'contracts')
    $out = npx hardhat test 2>&1 | Select-String 'passing|failing' | Select-Object -First 2
    Pop-Location
    $tests = ($out -join ' ').Trim()
  }

  Add-Content $report "[$ts] site:$s1 | waitlist:$s2 | supply:$sup | presaleRaisedWei:$raise | jobs:$jc | tests: $tests" -Encoding utf8
  Start-Sleep -Seconds (15 * 60)
}

"" | Add-Content $report -Encoding utf8
"NIGHT WATCH COMPLETE $(Get-Date)" | Add-Content $report -Encoding utf8
"All lines site:OK + supply:1000000000000000000000000000000 (1B) = stable night" | Add-Content $report -Encoding utf8
Write-Host "Done - open MORNING_REPORT.md"
