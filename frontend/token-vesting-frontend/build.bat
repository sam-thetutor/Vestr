@echo off
echo 🚀 Building Token Vesting Frontend...

REM Navigate to the frontend directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Run the build
echo 🔨 Running Next.js build...
npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Build completed successfully!
    echo 📁 Build output is in the .next directory
    echo 🚀 To start the production server, run: npm start
) else (
    echo ❌ Build failed. Check the error messages above.
    exit /b 1
)



