#!/bin/bash

# Token Vesting Frontend Build Script
echo "🚀 Building Token Vesting Frontend..."

# Navigate to the frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the build
echo "🔨 Running Next.js build..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output is in the .next directory"
    echo "🚀 To start the production server, run: npm start"
else
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi



