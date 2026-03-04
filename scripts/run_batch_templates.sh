#!/bin/bash
# ─────────────────────────────────────────────────────────
# Run a template batch: build JSON → gen images → optimize
#
# Usage:
#   ./scripts/run_batch_templates.sh batch_6_coffee_mood
#   ./scripts/run_batch_templates.sh batch_6_coffee_mood --skip-existing
#   ./scripts/run_batch_templates.sh batch_6_coffee_mood --dry-run
# ─────────────────────────────────────────────────────────

set -e

BATCH_NAME="${1:?Usage: $0 <batch_name> [--skip-existing] [--dry-run]}"
shift
EXTRA_FLAGS="$@"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMFYUI_URL="http://localhost:8188"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  FlexShot Template Batch Runner                         ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Batch:  $BATCH_NAME"
echo "║  Flags:  ${EXTRA_FLAGS:-none}"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 0: Check batch file exists ──────────────────────
BATCH_FILE="$SCRIPT_DIR/data/template_defs/${BATCH_NAME}.json"
if [ ! -f "$BATCH_FILE" ]; then
  echo "ERROR: Batch file not found: $BATCH_FILE"
  echo "Available batches:"
  ls "$SCRIPT_DIR/data/template_defs/"
  exit 1
fi

TEMPLATE_COUNT=$(python3 -c "import json; print(len(json.load(open('$BATCH_FILE'))))" 2>/dev/null || node -e "console.log(JSON.parse(require('fs').readFileSync('$BATCH_FILE','utf-8')).length)")
echo "[INFO] Batch file: $BATCH_FILE ($TEMPLATE_COUNT templates)"

# ── Step 1: Check ComfyUI server ─────────────────────────
echo ""
echo "── Step 1: Check ComfyUI server ──"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$COMFYUI_URL/api/health" 2>/dev/null || echo "000")
if [ "$HEALTH" = "000" ]; then
  echo "ERROR: ComfyUI server not running at $COMFYUI_URL"
  echo "Start it first, then re-run this script."
  exit 1
fi
echo "[OK] ComfyUI server alive at $COMFYUI_URL"

# ── Step 2: Build JSON from batch ────────────────────────
echo ""
echo "── Step 2: Build template JSON ──"
cd "$SCRIPT_DIR"
npx ts-node tools/gen_100_templates.ts --batch "$BATCH_NAME"
echo "[OK] Batch JSON built"

# ── Step 3: Rebuild full templates JSON ──────────────────
echo ""
echo "── Step 3: Rebuild full flexshot_templates.json ──"
npx ts-node tools/gen_100_templates.ts
echo "[OK] Full JSON rebuilt"

# ── Step 4: Generate images via ComfyUI ──────────────────
echo ""
echo "── Step 4: Generate images via ComfyUI ──"

# Find the template IDs for this batch from the full JSON
OUTPUT_JSON="$PROJECT_DIR/public/config/flexshot_templates.json"

# Get slugs from batch file
SLUGS=$(node -e "
  const batch = JSON.parse(require('fs').readFileSync('$BATCH_FILE','utf-8'));
  const full = JSON.parse(require('fs').readFileSync('$OUTPUT_JSON','utf-8'));
  const batchSlugs = new Set(batch.map(b => b.slug));
  const ids = full.templates.filter(t => {
    const slug = t.coverImage.split('/').pop().replace('.png','').replace(/^t\\d+_/, '');
    return batchSlugs.has(slug);
  }).map(t => t.id);
  console.log(ids.join(','));
")

echo "[INFO] Template IDs in this batch: $SLUGS"

# Generate each template image
IFS=',' read -ra ID_ARRAY <<< "$SLUGS"
TOTAL=${#ID_ARRAY[@]}
CURRENT=0

for TID in "${ID_ARRAY[@]}"; do
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "[$CURRENT/$TOTAL] Generating $TID..."
  npx ts-node tools/gen_sample_images.ts --templates --id "$TID" --skip-upload $EXTRA_FLAGS 2>&1 | tail -20
done

# ── Step 5: Summary ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  BATCH COMPLETE: $BATCH_NAME"
echo "  Templates: $TEMPLATE_COUNT"
echo "  Images dir: $PROJECT_DIR/generated_images/"
echo "  JSON: $OUTPUT_JSON"
echo "═══════════════════════════════════════════════════════════"
