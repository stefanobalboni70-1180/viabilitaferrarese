$ErrorActionPreference = 'Stop'

Write-Host "Inizio backup completo..."

# 1. Creazione cartella backup se non esiste
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$backupDir = "c:\Users\acer\Desktop\viabilita 118\backup_v3.8.0"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# 2. Copia di tutti i file di codice sorgente e asset
$filesToBackup = @(
    "index.html",
    "script.js",
    "style.css",
    "manifest.json",
    "README.md",
    "AGENTS.md",
    "database.rules.json",
    "icon-512.jpg",
    "icon-sagra.png",
    "logo_118.png"
)

foreach ($f in $filesToBackup) {
    $src = Join-Path "c:\Users\acer\Desktop\viabilita 118" $f
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $backupDir -Force
        Write-Host "File copiato in backup: $f"
    }
}

# 3. Download dati completi da Firebase Realtime Database
$dbEndpoints = @(
    @{ Name = "markers"; Url = "https://viabilita-ferrarese-a7b75-default-rtdb.europe-west1.firebasedatabase.app/markers.json" },
    @{ Name = "urgent_news"; Url = "https://viabilita-ferrarese-a7b75-default-rtdb.europe-west1.firebasedatabase.app/urgent_news.json" },
    @{ Name = "deleted_markers"; Url = "https://viabilita-ferrarese-a7b75-default-rtdb.europe-west1.firebasedatabase.app/deleted_markers.json" }
)

foreach ($ep in $dbEndpoints) {
    try {
        Write-Host "Download dati: $($ep.Name)..."
        $response = Invoke-RestMethod -Uri $ep.Url -Method Get
        $jsonStr = $response | ConvertTo-Json -Depth 20
        $outPath = Join-Path $backupDir "$($ep.Name).json"
        [System.IO.File]::WriteAllText($outPath, $jsonStr, [System.Text.Encoding]::UTF8)
        Write-Host "Salvato $($ep.Name).json ($([System.IO.FileInfo]::new($outPath).Length) bytes)"
    } catch {
        Write-Warning "Impossibile scaricare $($ep.Name): $_"
    }
}

# 4. Creazione archivio ZIP unico con timestamp
$zipPath = "c:\Users\acer\Desktop\viabilita 118\backup_completo_v3.8.0_$timestamp.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$backupDir\*" -DestinationPath $zipPath -Force
Write-Host "Archivio ZIP completo creato con successo in: $zipPath"
