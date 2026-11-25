param([ValidateSet('check','install','restore')][string]$Mode='check',[string]$Resources)
$ErrorActionPreference='Stop'
$node=Get-Command node.exe -ErrorAction SilentlyContinue
if(-not $node){Write-Host 'Node.js 22+ is required. Download from https://nodejs.org/';exit 1}
$version=& $node.Source --version
$major=($version.TrimStart('v') -split '\.')[0]
if([int]$major -lt 22){Write-Host 'Node.js 22+ required';exit 1}
$cli=Join-Path $PSScriptRoot 'patch.mjs'
$argsList=@($cli,$Mode)
if($Resources){$argsList+=@('--resources',$Resources)}
if($Mode -ne 'check'){
 Write-Host 'Close ALL T3 Code windows/processes. No automatic restart. Exact version/hash required.'
 Write-Host 'INSTALL changes only server.asar and saves an exact original backup. RESTORE uses that backup.'
 $answer=Read-Host 'Type YES to apply; anything else cancels'
 if($answer -cne 'YES'){Write-Host 'Cancelled. No changes.';exit 1}
 $argsList+='--apply'
}
& $node.Source @argsList
exit $LASTEXITCODE
