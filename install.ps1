<#>
.SYNOPSIS
    Universal Omukuumi Installer for Windows PowerShell

.DESCRIPTION
    Installs Omukuumi CLI on Windows. Downloads the latest release binary,
    verifies checksum, extracts to install directory, and adds to PATH.

.PARAMETER Version
    Specific version to install (default: latest)

.PARAMETER InstallDir
    Installation directory (default: $env:USERPROFILE\.omukuumi-cli)

.PARAMETER NoVerify
    Skip SHA256 checksum verification

.PARAMETER Force
    Force reinstall even if already installed

.PARAMETER Help
    Show this help message

.EXAMPLE
    iwr https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.ps1 -UseB | iex

.EXAMPLE
    iwr https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.ps1 -UseB | iex -Version v0.81.0

.EXAMPLE
    iwr https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.ps1 -UseB | iex -InstallDir "C:\Tools\omukuumi"
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$Version = "",

    [Parameter()]
    [string]$InstallDir = "$env:USERPROFILE\.omukuumi-cli",

    [switch]$NoVerify,

    [switch]$Force,

    [switch]$Help
)

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Definition -Full
    exit 0
}

# Colors
$Red = [ConsoleColor]::Red
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Blue = [ConsoleColor]::Cyan
$Reset = [ConsoleColor]::Gray

function Log-Info { param([string]$msg) Write-Host "[$(Get-Date -Format HH:mm:ss)] ${Blue}[INFO]${Reset} $msg" }
function Log-Ok   { param([string]$msg) Write-Host "[$(Get-Date -Format HH:mm:ss)] ${Green}[OK]${Reset} $msg" }
function Log-Warn { param([string]$msg) Write-Host "[$(Get-Date -Format HH:mm:ss)] ${Yellow}[WARN]${Reset} $msg" }
function Log-Err  { param([string]$msg) Write-Host "[$(Get-Date -Format HH:mm:ss)] ${Red}[ERR]${Reset} $msg" }

# Detect architecture
$arch = (Get-CimInstance Win32_Processor).AddressWidth
if ($arch -eq 64) { $ARCH = "x64" } else { $ARCH = "arm64" }
$OS = "windows"
$REPO = "omukuumi/omukuumi-cli"

Log-Info "Detected platform: $OS-$ARCH"

# Get version
if (-not $Version) {
    Log-Info "Fetching latest version from GitHub..."
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/omukuumi/omukuumi-cli/releases/latest" -ErrorAction Stop
        $Version = $release.tag_name -replace '^v', ''
        Log-Ok "Latest version: $Version"
    } catch {
        Log-Err "Failed to fetch latest version: $_"
        exit 1
    }
} else {
    Log-Info "Installing version: $Version"
}

# Check if already installed
$binPath = Join-Path $InstallDir "omukuumi.exe"
if (Test-Path $binPath -and -not $Force) {
    Log-Warn "Omukuumi already installed at $InstallDir"
    Log-Info "Use -Force to reinstall, or run: $binPath --version"
    exit 0
}

# Download
$fileName = "omukuumi-windows-$ARCH.zip"
$url = "https://github.com/omukuumi/omukuumi-cli/releases/download/v$Version/$fileName"
$archive = Join-Path $env:TEMP $fileName

Log-Info "Downloading $fileName..."
try {
    Invoke-WebRequest -Uri $url -OutFile $archive -ErrorAction Stop
    Log-Ok "Downloaded to $archive"
} catch {
    Log-Err "Download failed: $_"
    Log-Err "Check if version exists: https://github.com/omukuumi/omukuumi-cli/releases/tag/v$Version"
    exit 1
}

# Verify checksum
if (-not $NoVerify) {
    Log-Info "Verifying checksum..."
    try {
        $shaUrl = "https://github.com/omukuumi/omukuumi-cli/releases/download/v$Version/SHA256SUMS"
        $shaRemote = (Invoke-RestMethod -Uri $shaUrl -ErrorAction SilentlyContinue) | Select-String $fileName | ForEach-Object { ($_ -split '\s+')[0] }
        $shaLocal = (Get-FileHash -Algorithm SHA256 $archive).Hash.ToLower()

        if ($shaRemote -and $shaLocal -eq $shaRemote.ToLower()) {
            Log-Ok "Checksum verified"
        } elseif (-not $shaRemote) {
            Log-Warn "No SHA256SUMS found on release, skipping verification"
        } else {
            Log-Err "Checksum mismatch! Expected: $shaRemote, Got: $shaLocal"
            exit 1
        }
    } catch {
        Log-Warn "Could not verify checksum: $_"
    }
} else {
    Log-Warn "Skipping checksum verification (-NoVerify)"
}

# Extract
Log-Info "Extracting to $InstallDir..."
if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }

try {
    Expand-Archive -Path $archive -DestinationPath $InstallDir -Force -ErrorAction Stop
    Log-Ok "Extracted to $InstallDir"
} catch {
    Log-Err "Extract failed: $_"
    exit 1
}

# Ensure binary is executable and in right place
$binPath = Join-Path $InstallDir "omukuumi.exe"
if (-not (Test-Path $binPath)) {
    $found = Get-ChildItem $InstallDir -Recurse -Filter "omukuumi.exe" | Select-Object -First 1
    if ($found) {
        Move-Item $found.FullName $binPath -Force
    }
}

# Add to PATH (user scope)
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$InstallDir*") {
    $newPath = "$InstallDir;$currentPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Log-Ok "Added $InstallDir to user PATH"
    Log-Warn "Restart your terminal or run: refreshenv"
} else {
    Log-Info "PATH already contains $InstallDir"
}

# Create symlink in ~/bin if exists
$localBin = Join-Path $env:USERPROFILE "bin"
if (Test-Path $localBin) {
    $link = Join-Path $localBin "omukuumi.exe"
    if (-not (Test-Path $link)) {
        New-Item -ItemType SymbolicLink -Path $link -Target (Join-Path $InstallDir "omukuumi.exe") | Out-Null
        Log-Ok "Created symlink: $link"
    }
}

Log-Ok "Omukuumi $Version installed successfully!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart your terminal, or run: refreshenv"
Write-Host "  2. Run Omukuumi:"
Write-Host "     omukuumi"
Write-Host ""
Write-Host "Install location: $InstallDir"
Write-Host "Binary: omukuumi.exe"