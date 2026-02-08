@echo off
echo ========================================================
echo   MANUAL UPDATE - Pharmacy Management System
echo ========================================================
echo.
echo Uploading your local files directly to Vercel...
echo.
call npx vercel --prod
echo.
echo ========================================================
echo   DONE! Your app is updated.
echo   You can close this window.
echo ========================================================
pause
