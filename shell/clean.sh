#!/bin/bash
set -e

echo "Cleaning Lumina application..."

# Clean Server
echo "=> Cleaning backend..."
cd server
if [ -d "node_modules" ]; then
  echo "Removing node_modules..."
  rm -rf node_modules
fi
if [ -d "dist" ]; then
  echo "Removing dist folder..."
  rm -rf dist
fi
cd ..

# Clean Client
echo "=> Cleaning frontend..."
cd client
if [ -d "node_modules" ]; then
  echo "Removing node_modules..."
  rm -rf node_modules
fi
if [ -d "build" ]; then
  echo "Removing build folder..."
  rm -rf build
fi
cd ..

echo "Clean up completed."
