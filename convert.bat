@echo off
chcp 65001 >nul
title BSON to JSON Converter

cd /d "%~dp0"

REM Install packages if needed (first run only)
if not exist "node_modules\" (
    echo 필요한 패키지 설치 중...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo 오류: 패키지 설치에 실패했습니다.
        echo Node.js를 https://nodejs.org/ 에서 설치해주세요.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo 설치 완료!
    echo.
)

REM Run conversion
node simple-convert.js

echo.
echo 완료! output 폴더에서 변환된 JSON 파일을 확인하세요.
echo.
pause
