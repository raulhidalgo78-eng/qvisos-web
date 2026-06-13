# =====================================================================
# Script para subir los cambios de esta carpeta al repo qvisos-web
# Ejecutar con SUBIR.bat
# =====================================================================

Start-Transcript -Path "$PSScriptRoot\subir-log.txt" -Force | Out-Null

$origen = $PSScriptRoot
$clon   = "$env:USERPROFILE\qvisos-web"
$repo   = "https://github.com/raulhidalgo78-eng/qvisos-web.git"

# 1. Clonar si no existe
if (-not (Test-Path "$clon\.git")) {
    Write-Host ">> Clonando repositorio en $clon ..." -ForegroundColor Cyan
    git clone $repo $clon
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR al clonar. Revisa que Git este instalado y tengas acceso al repo." -ForegroundColor Red
        Stop-Transcript | Out-Null
        exit 1
    }
} else {
    Write-Host ">> Actualizando clon existente..." -ForegroundColor Cyan
    git -C $clon pull
}

# 2. Borrar en el clon los archivos eliminados en la revision
$aBorrar = @(
    "lib\firebase.ts",
    "components\ActivarForm.tsx",
    "components\AnuncioClientWrapper.tsx",
    "components\AiChat.tsx",
    "components\KeyFeaturesGrid.tsx",
    "components\PublicMap.tsx",
    "app\qr",
    "app\dashboard",
    "app\api\create-kit",
    "app\api\activate-kit",
    "app\api\upload",
    "app\api\admin\approve\router.ts"
)
foreach ($f in $aBorrar) {
    $p = Join-Path $clon $f
    if (Test-Path $p) {
        Remove-Item $p -Recurse -Force
        Write-Host "   - eliminado: $f"
    }
}

# 3. Copiar archivos nuevos/modificados
Write-Host ">> Copiando archivos..." -ForegroundColor Cyan
robocopy $origen $clon /E /XD ".git" "node_modules" ".next" /XF "oswaldFont.ts" "CAMBIOS.md" "DOMINIO-NIC-VERCEL.md" "SUBIR-A-GITHUB.ps1" "SUBIR.bat" "subir-log.txt" | Out-Null

# 4. Regenerar package-lock
Write-Host ">> Ejecutando npm install..." -ForegroundColor Cyan
Push-Location $clon
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ADVERTENCIA: npm install fallo. Revisa el detalle arriba." -ForegroundColor Yellow
}

# 5. Commit y push
git add -A
git commit -m "Mejoras: seguridad admin, SEO completo, migracion a Supabase nuevo, limpieza de codigo muerto"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "LISTO - Vercel desplegara automaticamente en unos 2 minutos." -ForegroundColor Green
} else {
    Write-Host "ERROR en el push. Revisa tus credenciales de GitHub." -ForegroundColor Red
}
Pop-Location
Stop-Transcript | Out-Null
