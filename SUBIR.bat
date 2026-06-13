@echo off
title Subir qvisos a GitHub
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0SUBIR-A-GITHUB.ps1"
echo.
echo (Si hubo errores quedaron guardados en subir-log.txt)
pause
