#!/bin/bash
set -e

echo "Running tests for Lumina Application..."

# Test Backend
echo "=> Testing backend..."
cd server
if grep -q "\"test\":" package.json; then
  npm test
else
  echo "No test script defined for backend."
fi
cd ..

# Test Frontend
echo "=> Testing frontend..."
cd client
if grep -q "\"test\":" package.json; then
  npm test
else
  echo "No test script defined for frontend."
fi
cd ..

echo "All tests executed."
