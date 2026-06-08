@echo off
chcp 65001 >nul
title NipponTrip - 일본 여행 플래너
cd /d "%~dp0"

echo ========================================
echo   NipponTrip 개발 서버 시작
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo        https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행하세요.
    pause
    exit /b 1
)

if not exist ".env" (
    echo [안내] .env 파일이 없어 .env.example 을 복사합니다.
    copy /Y ".env.example" ".env" >nul
    echo        .env 를 열어 AUTH_SECRET, DATABASE_URL, 구글 키를 채워주세요.
    echo.
)

echo [확인] NextAuth 환경 변수...
call npm run check:auth
if errorlevel 1 (
    echo.
    echo [오류] .env 파일을 만들고 AUTH_SECRET 을 설정한 뒤 다시 실행하세요.
    echo.
    pause
    exit /b 1
)
echo.

call npm run check:kakao
if errorlevel 1 (
    echo [안내] 카카오 로그인 미설정 — .env 에 AUTH_KAKAO_ID, AUTH_KAKAO_SECRET 을 넣으면 활성화됩니다.
    echo.
)

if exist ".next\dev\lock" (
    echo [안내] 이전 개발 서버 잠금 파일을 제거합니다...
    del /F /Q ".next\dev\lock" >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [안내] 3000 포트 사용 중 프로세스 %%a 종료...
    taskkill /PID %%a /F >nul 2>&1
)

if not exist "node_modules\" (
    echo [1/3] 패키지 설치 중... (최초 1회, 시간이 걸릴 수 있습니다)
    call npm install
    if errorlevel 1 (
        echo [오류] npm install 실패
        pause
        exit /b 1
    )
    echo.
) else (
    echo [1/3] 패키지 확인 완료
)

echo [2/3] Prisma 클라이언트 생성...
call npx prisma generate >nul 2>&1

echo [3/3] DB 스키마 동기화 (PostgreSQL 연결 필요)...
call npx prisma db push
if errorlevel 1 (
    echo.
    echo [경고] DB 연결 실패 - .env 의 DATABASE_URL 을 확인하세요.
    echo        Neon 사용 시: Dashboard ^> Connect ^> Prisma 연결 문자열 복사
    echo        UI만 보려면 계속 진행할 수 있으나 구글 로그인/저장은 동작하지 않습니다.
    echo.
) else (
    echo        DB 연결 OK
)
echo.

echo 서버 주소: http://localhost:3000
echo 종료하려면 이 창에서 Ctrl+C 를 누르세요.
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

if exist ".env" (
    findstr /B /C:"CRON_SECRET=" ".env" | findstr /V /C:"CRON_SECRET=\"\"" | findstr /V "원하는_긴_랜덤" >nul 2>&1
    if not errorlevel 1 (
        echo [안내] 카카오 지정 시간 알림 Cron 함께 시작 ^(작업 표시줄 최소화 창^)
        start /MIN "NipponTrip Cron" cmd /c "cd /d "%~dp0" && npm run cron:local"
    )
)

call npm run dev

pause
