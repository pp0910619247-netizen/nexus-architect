# AUTORUN NIGHT WATCH - Nexus Architect (ASCII-safe for PS 5.1)
# Run: powershell -ExecutionPolicy Bypass -File AUTORUN_NIGHT.ps1          (default 12h)
#      powershell ... -Hours 8
# NOTE 2026-09: moved to POLYGON MAINNET - presale live 0xB1293..., token 0x770A...
# Notifications/Oracles/sel verified against live mainnet. contracts/ no longer in repo.

param([int]$Hours = 12)
$ErrorActionPreference = 'Continue'
$root     = Split-Path -Parent $MyInvocation.MyCommand.Path
$report   = Join-Path $root 'MORNING_REPORT.md'
$deadline = (Get-Date).AddHours($Hours)
$site     = 'https://pp0910619247-netizen.github.io/nexus-architect/'
$rpc      = 'https://polygon-bor-rpc.publicnode.com'   # MAINNET
$nexAddr  = '0x770AFC829e87d9A3467b20d6f3E5122BBa9BA0af'  # NEX32 token (mainnet)
$presale  = '0xB1293Ed631e4bDf568e91727F78fAd170cC58304'  # PublicSale (mainnet)

# selectors (verified by keccak against live ABI):
$SEL_totalSupply = '0x18160ddd'   # token.totalSupply()
$SEL_roundSold   = '0x6e7e6558'   # presale.roundSold()
$SEL_totalForSale= '0x1eec71fb'   # presale.TOTAL_FOR_SALE()
$SEL_currentRound= '0x8a19c8bc'   # presale.currentRound()

"## MORNING REPORT - generated $(Get-Date)"       | Out-File $report -Encoding utf8
"Watch every 15min until $deadline (mainnet)"       | Out-File $report -Append -Encoding utf8

function Check-Site($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    return "OK $($r.StatusCode)"
  } catch { return "DOWN: $($_.Exception.Message)" }
}
function HexToBig($h) {
  if (-not $h -or $h -eq '0x') { return [bigint]0 }
  try { return [bigint]::Parse($h.Substring(2), 'HexNumber') } catch { return [bigint]-1 }
}
function HumanSupply($big) { return [math]::Round([double]$big / 1e18, 0) }   # token (18 dec)
function HumanSold($big)   { return [math]::Round([double]$big / 1e18, 2) }   # NEX count (18 dec)
function ChainCall($to, $data) {
  $obj = @{ jsonrpc='2.0'; id=1; method='eth_call';
            params=@(@{to=$to; data=$data}, 'latest') }
  try {
    $body = $obj | ConvertTo-Json -Depth 5 -Compress
    $r = Invoke-RestMethod -Uri $rpc -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 20
    if ($r.result) { return $r.result } else { return 'ERR' }
  } catch { return 'ERR' }
}

$i = 0
while ((Get-Date) -lt $deadline) {
  $i++
  $ts = Get-Date -Format 'HH:mm:ss'

  $s1   = Check-Site $site
  $s2   = Check-Site "$site/waitlist.html"
  $sup  = HumanSupply (HexToBig (ChainCall $nexAddr  $SEL_totalSupply))
  $sold = HumanSold  (HexToBig (ChainCall $presale  $SEL_roundSold))
  $total= HumanSold  (HexToBig (ChainCall $presale  $SEL_totalForSale))
  $round= (HexToBig  (ChainCall $presale  $SEL_currentRound))

  $pct = if ($total -gt 0) { [math]::Round($sold / $total * 100, 2) } else { '-' }

  Add-Content $report "[$ts] site:$s1 | waitlist:$s2 | NEX_supplyM:$sup | presale_soldM:$sold / totalM:$total ($pct%) | round:$round" -Encoding utf8
  Start-Sleep -Seconds (15 * 60)
}

"" | Add-Content $report -Encoding utf8
"NIGHT WATCH COMPLETE $(Get-Date)" | Add-Content $report -Encoding utf8
"Unhealthy if NEX_supplyM != 1000 (1B x 1e-18) or site DOWN." | Add-Content $report -Encoding utf8
Write-Host "Done - open MORNING_REPORT.md"