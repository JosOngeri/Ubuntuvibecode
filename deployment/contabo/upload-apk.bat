@echo off
REM Upload APK to Contabo Server (Windows)
REM Run this script locally to upload the built APK to Contabo

REM Configuration - Update these values
set CONTABO_USER=your-username
set CONTABO_IP=your-contabo-ip
set APK_PATH=D:\0000 SCO400 Project 2026\Ubuntu APP\app\build\outputs\apk\release\app-release.apk
set APK_NAME=ubuntu-hrms-latest.apk

echo Uploading Ubuntu HRMS APK to Contabo...

REM Check if APK exists
if not exist "%APK_PATH%" (
    echo APK not found at: %APK_PATH%
    echo Please build the APK first using: scripts\build-release.bat
    pause
    exit /b 1
)

REM Upload APK
scp "%APK_PATH%" %CONTABO_USER%@%CONTABO_IP%:/var/www/ubuntu-hrms/apk/%APK_NAME%

if %errorlevel% equ 0 (
    echo APK uploaded successfully!
    echo Download URL: http://%CONTABO_IP%/apk/%APK_NAME%
    
    REM Set permissions
    ssh %CONTABO_USER%@%CONTABO_IP% "chmod 644 /var/www/ubuntu-hrms/apk/%APK_NAME%"
) else (
    echo Upload failed!
    pause
    exit /b 1
)

pause
