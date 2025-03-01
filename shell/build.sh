#!/bin/bash
set -e

echo "Building Lumina Application..."

# Build Backend
echo "=> Building backend..."
cd server
echo "Installing backend dependencies..."
npm install
if grep -q "\"build\":" package.json; then
  echo "Running backend build..."
  npm run build
else
  echo "No build script defined for backend."
fi
cd ..

# Build Frontend
echo "=> Building frontend..."
cd client
echo "Installing frontend dependencies..."
npm install
echo "Running frontend build..."
npm run build
cd ..

echo "Build completed successfully."
