#!/bin/bash
# deploy_functions.sh
#
# Build and deploy Cloud Functions for Firebase.
# Usage: bash deploy/deploy_functions.sh [--only <function_name>]
#
# Options:
#   --only <name>   Deploy only a specific function (e.g., --only generateFlexShot)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FUNCTIONS_DIR="$PROJECT_ROOT/cloud_functions"

echo "============================================"
echo " FlexMe - Deploy Cloud Functions"
echo "============================================"
echo ""

# Check that cloud_functions directory exists
if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "ERROR: cloud_functions directory not found at $FUNCTIONS_DIR"
  exit 1
fi

# Check for firebase CLI
if ! command -v firebase &> /dev/null; then
  echo "ERROR: firebase CLI not found. Install with: npm install -g firebase-tools"
  exit 1
fi

# Parse arguments
DEPLOY_ARGS="--only functions"
if [ "${1:-}" = "--only" ] && [ -n "${2:-}" ]; then
  DEPLOY_ARGS="--only functions:$2"
  echo "Deploying single function: $2"
else
  echo "Deploying all functions"
fi

echo ""

# Step 1: Install dependencies
echo "[1/3] Installing dependencies..."
cd "$FUNCTIONS_DIR"
if [ -f "package-lock.json" ]; then
  npm ci --silent
else
  npm install --silent
fi

# Step 2: Build TypeScript
echo "[2/3] Building TypeScript..."
npm run build
echo "Build complete."

# Step 3: Deploy
echo "[3/3] Deploying to Firebase..."
cd "$PROJECT_ROOT"
firebase deploy $DEPLOY_ARGS --project "${FIREBASE_PROJECT:-flexmenow}"

echo ""
echo "============================================"
echo " Deployment complete!"
echo "============================================"
