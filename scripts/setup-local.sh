#!/usr/bin/env bash
set -e

echo "===================================================="
echo "DevTrack Local Setup (Linux / macOS / WSL)"
echo "===================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "[1/3] Installing Backend Dependencies..."
cd "$DIR/../backend"
npm install

echo "[2/3] Installing Frontend Dependencies..."
cd "$DIR/../frontend"
npm install

echo "[3/3] Building Frontend & Seeding Demo Database..."
npm run build
cd "$DIR/../backend"
npm run seed

echo "===================================================="
echo "Setup Completed Successfully!"
echo "Backend:  cd backend && npm run dev"
echo "Frontend: cd frontend && npm run dev"
echo "===================================================="
