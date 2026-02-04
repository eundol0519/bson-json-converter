@echo off
chcp 65001 > nul
title JSON → BSON 변환기

echo.
echo ═══════════════════════════════════
echo 🔄 JSON → BSON 변환기
echo ═══════════════════════════════════
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo 📥 https://nodejs.org/ 에서 Node.js를 설치해주세요.
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js 발견
echo.

REM Check if node_modules exists in parent directory
if not exist "..\node_modules\" (
    echo 📦 필요한 패키지 설치 중...
    echo.
    cd ..
    call npm install
    cd json-to-bson
    echo.
    if %errorlevel% neq 0 (
        echo ❌ 패키지 설치 실패
        pause
        exit /b 1
    )
    echo ✓ 패키지 설치 완료
    echo.
)

REM Run the converter
node convert.js

echo.
pause

