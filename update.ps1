if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed. Please install Git before running this update script."
    Read-Host -Prompt "Press Enter to exit"

    exit
}

$currentBranch = git rev-parse --abbrev-ref HEAD

if ($currentBranch -ne "main") {
    Write-Host "Current branch is '$currentBranch'. Switching to 'main'..."
    git checkout main
}

Write-Host "Pulling latest changes from 'main' branch..."
git pull origin main

Write-Host "Project updated successfully. Press Enter to exit."
Read-Host
