@echo off
echo ==============================================
echo      NODUS HARD RESET TOOL
echo ==============================================
echo.
echo 1. Killing all Node.js processes (to unlock files)...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 2. Deleting corrupted cache (.next folder)...
if exist .next (
    rmdir /s /q .next
    echo    - Cache deleted.
) else (
    echo    - Cache already clean.
)

echo.
echo 3. Verifying dependencies...
call npm install

echo.
echo 4. Starting Server...
echo    (If it fails again, please manually delete the '.next' folder)
echo.
call npm run dev
pause
