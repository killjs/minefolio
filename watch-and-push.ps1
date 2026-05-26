# watch-and-push.ps1
# OneDrive\AI\public 감시 -> content 폴더로 복사 -> git push

$repoPath  = "C:\Users\ggy06\Documents\sufill\quartz"
$watchPath = "C:\Users\ggy06\OneDrive\AI\public"
$contentPath = Join-Path $repoPath "content"

if (-not (Test-Path $watchPath)) {
    Write-Error "감시 폴더를 찾을 수 없습니다: $watchPath"
    exit 1
}
if (-not (Test-Path $contentPath)) {
    Write-Error "content 폴더를 찾을 수 없습니다: $contentPath"
    exit 1
}

Write-Host "감시 시작: $watchPath"
Write-Host "변경 감지 시: $watchPath -> $contentPath 복사 후 git push"
Write-Host "종료하려면 Ctrl+C 를 누르세요.`n"

# 디바운스: 연속 변경을 묶어서 한 번만 처리
$lastEventTime  = [datetime]::MinValue
$debounceSeconds = 5
$pendingSync    = $false

function Invoke-SyncAndPush {
    param([string]$changedFile)

    $now = [datetime]::Now
    $script:lastEventTime = $now
    $script:pendingSync   = $true

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 변경 감지: $changedFile"
}

# FileSystemWatcher 설정
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path                  = $watchPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents   = $true

$action = { Invoke-SyncAndPush $EventArgs.FullPath }

$onChange = Register-ObjectEvent $watcher "Changed" -Action $action
$onCreate = Register-ObjectEvent $watcher "Created" -Action $action
$onDelete = Register-ObjectEvent $watcher "Deleted" -Action $action
$onRename = Register-ObjectEvent $watcher "Renamed" -Action $action

# 메인 루프: 디바운스 후 실제 복사 + git push
try {
    while ($true) {
        Start-Sleep -Milliseconds 500

        if (-not $script:pendingSync) { continue }

        $elapsed = ([datetime]::Now - $script:lastEventTime).TotalSeconds
        if ($elapsed -lt $debounceSeconds) { continue }

        $script:pendingSync = $false
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 동기화 시작..."

        # 1) public -> content 복사 (삭제된 파일 포함 미러링)
        try {
            robocopy $watchPath $contentPath /MIR /XD .git /NFL /NDL /NJH /NJS 2>&1 | Out-Null
            Write-Host "  -> 복사 완료: $watchPath -> $contentPath"
        }
        catch {
            Write-Warning "  -> 복사 오류: $_"
            continue
        }

        # 2) git add / commit / push
        Push-Location $repoPath
        try {
            $status = git status --porcelain 2>&1
            if (-not $status) {
                Write-Host "  -> 변경사항 없음 (복사 후에도 diff 없음)`n"
                continue
            }

            $commitMsg = "auto: update content $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

            git add content/ 2>&1 | Out-Null
            git commit -m $commitMsg 2>&1 | Write-Host
            git push 2>&1 | Write-Host

            Write-Host "  -> 완료: $commitMsg`n"
        }
        catch {
            Write-Warning "  -> Git 오류: $_"
        }
        finally {
            Pop-Location
        }
    }
}
finally {
    Unregister-Event $onChange.Id
    Unregister-Event $onCreate.Id
    Unregister-Event $onDelete.Id
    Unregister-Event $onRename.Id
    $watcher.Dispose()
    Write-Host "`n감시 종료."
}
