if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python is not installed. Please install Python before running this script."
    Read-Host -Prompt "Press Enter to exit"

    exit
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install Node.js before running this script."
    Read-Host -Prompt "Press Enter to exit"

    exit
}

if (-not (Test-Path ".\backend\env\Scripts\Activate.ps1")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv .\backend\env
}

Write-Host "Activating virtual environment..."
. .\backend\env\Scripts\Activate.ps1

Write-Host "Installing Python dependencies..."
pip install -r .\backend\requirements.txt

Write-Host "Navigating to Angular project folder..."
Set-Location .\front-end

Write-Host "Installing Node dependencies..."
npm install

Write-Host "Dependencies have been installed. Press Enter to exit."
Read-Host
