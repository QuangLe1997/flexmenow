#!/bin/bash
# publish_json.sh
#
# Build and upload JSON data files (templates, stories) to GCS config/ bucket path.
# Runs seed scripts in --out mode, then uploads to Firebase Storage.
#
# Usage: bash deploy/publish_json.sh [--bucket <bucket>] [--dry-run]
#
# Options:
#   --bucket <name>   Override default GCS bucket name
#   --dry-run         Generate JSON files locally without uploading to GCS

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$SCRIPTS_ROOT/.output"

# Default values
BUCKET="${FIREBASE_STORAGE_BUCKET:-flexmenow.firebasestorage.app}"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)
      BUCKET="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "============================================"
echo " FlexMe - Publish JSON Data to GCS"
echo "============================================"
echo ""
echo "Bucket:   $BUCKET"
echo "Dry run:  $DRY_RUN"
echo "Output:   $OUTPUT_DIR"
echo ""

# Check for required tools
if ! command -v npx &> /dev/null; then
  echo "ERROR: npx not found. Install Node.js."
  exit 1
fi

if [ "$DRY_RUN" = false ]; then
  if ! command -v gsutil &> /dev/null && ! command -v gcloud &> /dev/null; then
    echo "WARNING: gsutil/gcloud not found. Will attempt firebase-admin upload via ts-node."
  fi
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Step 1: Generate template JSON
echo "[1/4] Generating FlexShot templates..."
cd "$SCRIPTS_ROOT"
npx ts-node seed/seed_templates.ts --dry-run --out "$OUTPUT_DIR/flexshot_templates.json" > /dev/null
echo "  -> $OUTPUT_DIR/flexshot_templates.json"

# Step 2: Generate story JSON
echo "[2/4] Generating FlexTale stories..."
npx ts-node seed/seed_stories.ts --dry-run --out "$OUTPUT_DIR/flextale_stories.json" > /dev/null
echo "  -> $OUTPUT_DIR/flextale_stories.json"

# Step 3: Validate generated JSON
echo "[3/4] Validating generated JSON..."
VALID=true

for JSON_FILE in "$OUTPUT_DIR/flexshot_templates.json" "$OUTPUT_DIR/flextale_stories.json"; do
  if [ ! -f "$JSON_FILE" ]; then
    echo "  ERROR: $JSON_FILE not found"
    VALID=false
    continue
  fi

  # Basic JSON syntax check using node
  if node -e "JSON.parse(require('fs').readFileSync('$JSON_FILE', 'utf-8'))" 2>/dev/null; then
    SIZE=$(wc -c < "$JSON_FILE" | tr -d ' ')
    echo "  OK: $(basename "$JSON_FILE") ($SIZE bytes)"
  else
    echo "  ERROR: $(basename "$JSON_FILE") is not valid JSON"
    VALID=false
  fi
done

if [ "$VALID" = false ]; then
  echo ""
  echo "ERROR: Some JSON files are invalid. Aborting upload."
  exit 1
fi

# Step 4: Upload to GCS
if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "[4/4] Dry run - skipping upload."
  echo ""
  echo "Generated files:"
  ls -la "$OUTPUT_DIR"/*.json
else
  echo ""
  echo "[4/4] Uploading to GCS..."

  if command -v gsutil &> /dev/null; then
    # Use gsutil for upload
    gsutil -m cp "$OUTPUT_DIR/flexshot_templates.json" "gs://$BUCKET/config/flexshot_templates.json"
    gsutil -m cp "$OUTPUT_DIR/flextale_stories.json" "gs://$BUCKET/config/flextale_stories.json"

    # Set cache headers
    gsutil setmeta -h "Cache-Control:public, max-age=300" "gs://$BUCKET/config/flexshot_templates.json"
    gsutil setmeta -h "Cache-Control:public, max-age=300" "gs://$BUCKET/config/flextale_stories.json"

    echo "  Uploaded to gs://$BUCKET/config/"
  else
    # Fallback: use the seed scripts directly (they upload via firebase-admin)
    echo "  gsutil not available, using firebase-admin SDK..."
    cd "$SCRIPTS_ROOT"
    FIREBASE_STORAGE_BUCKET="$BUCKET" npx ts-node seed/seed_templates.ts
    FIREBASE_STORAGE_BUCKET="$BUCKET" npx ts-node seed/seed_stories.ts
  fi
fi

echo ""
echo "============================================"
echo " Publish complete!"
echo "============================================"
echo ""
echo "Files available at:"
echo "  gs://$BUCKET/config/flexshot_templates.json"
echo "  gs://$BUCKET/config/flextale_stories.json"
