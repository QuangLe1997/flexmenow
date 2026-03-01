#!/bin/bash
# deploy_rules.sh
#
# Deploy Firestore security rules, indexes, and Storage security rules.
# Usage: bash deploy/deploy_rules.sh [--rules-only | --indexes-only | --storage-only]
#
# Options:
#   --rules-only     Deploy only Firestore rules
#   --indexes-only   Deploy only Firestore indexes
#   --storage-only   Deploy only Storage rules

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "============================================"
echo " FlexMe - Deploy Security Rules"
echo "============================================"
echo ""

# Check for firebase CLI
if ! command -v firebase &> /dev/null; then
  echo "ERROR: firebase CLI not found. Install with: npm install -g firebase-tools"
  exit 1
fi

cd "$PROJECT_ROOT"

# Verify rule files exist
FIRESTORE_RULES="cloud_functions/firestore/firestore.rules"
FIRESTORE_INDEXES="cloud_functions/firestore/firestore.indexes.json"
STORAGE_RULES="cloud_functions/firestore/storage.rules"

DEPLOY_TARGET=""

case "${1:-}" in
  --rules-only)
    echo "Deploying Firestore rules only..."
    DEPLOY_TARGET="--only firestore:rules"
    if [ ! -f "$FIRESTORE_RULES" ]; then
      echo "ERROR: Firestore rules not found at $FIRESTORE_RULES"
      exit 1
    fi
    ;;
  --indexes-only)
    echo "Deploying Firestore indexes only..."
    DEPLOY_TARGET="--only firestore:indexes"
    if [ ! -f "$FIRESTORE_INDEXES" ]; then
      echo "ERROR: Firestore indexes not found at $FIRESTORE_INDEXES"
      exit 1
    fi
    ;;
  --storage-only)
    echo "Deploying Storage rules only..."
    DEPLOY_TARGET="--only storage"
    if [ ! -f "$STORAGE_RULES" ]; then
      echo "ERROR: Storage rules not found at $STORAGE_RULES"
      exit 1
    fi
    ;;
  *)
    echo "Deploying all rules (Firestore rules + indexes + Storage)..."
    DEPLOY_TARGET="--only firestore:rules,firestore:indexes,storage"

    # Verify all files exist
    MISSING=0
    for f in "$FIRESTORE_RULES" "$FIRESTORE_INDEXES" "$STORAGE_RULES"; do
      if [ ! -f "$f" ]; then
        echo "WARNING: Missing file: $f"
        MISSING=1
      fi
    done
    if [ "$MISSING" -eq 1 ]; then
      echo ""
      echo "Some rule files are missing. Continue anyway? (y/N)"
      read -r REPLY
      if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
        echo "Aborted."
        exit 1
      fi
    fi
    ;;
esac

echo ""

# Deploy
firebase deploy $DEPLOY_TARGET --project "${FIREBASE_PROJECT:-flexmenow}"

echo ""
echo "============================================"
echo " Rules deployment complete!"
echo "============================================"
