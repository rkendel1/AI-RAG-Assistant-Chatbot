#!/bin/bash
set -e

echo "Starting Lumina development servers..."

# Start backend
echo "=> Starting backend..."
(
  cd server
  npm run dev
) &

# Start frontend
echo "=> Starting frontend..."
(
  cd client
  npm start
)

wait
