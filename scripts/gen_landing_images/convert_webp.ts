/**
 * Convert landing page images from PNG to WebP
 *
 * Uses sharp (already in scripts/package.json) to convert all PNG images
 * in public/assets/landing/ to WebP with quality optimization.
 *
 * Usage:
 *   npx ts-node scripts/gen_landing_images/convert_webp.ts
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const LANDING_DIR = path.resolve(__dirname, "../../public/assets/landing");
const QUALITY = 82; // WebP quality (80-85 is sweet spot for photo quality vs size)

async function main() {
  console.log("🔄 Converting landing images to WebP...\n");

  if (!fs.existsSync(LANDING_DIR)) {
    console.error(`❌ Directory not found: ${LANDING_DIR}`);
    process.exit(1);
  }

  const pngs = fs.readdirSync(LANDING_DIR).filter((f) => f.endsWith(".png"));

  if (pngs.length === 0) {
    console.log("⚠️  No PNG files found. Run gen_images.ts first.");
    return;
  }

  let converted = 0;
  for (const png of pngs) {
    const inputPath = path.join(LANDING_DIR, png);
    const outputPath = path.join(LANDING_DIR, png.replace(".png", ".webp"));

    const inputSize = fs.statSync(inputPath).size;

    await sharp(inputPath)
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(outputPath);

    const outputSize = fs.statSync(outputPath).size;
    const savedPct = ((1 - outputSize / inputSize) * 100).toFixed(0);

    console.log(
      `  ✅ ${png} → ${png.replace(".png", ".webp")}  ` +
        `(${(inputSize / 1024).toFixed(0)}KB → ${(outputSize / 1024).toFixed(0)}KB, -${savedPct}%)`
    );
    converted++;
  }

  console.log(`\n🎉 Converted ${converted} images. Saved to: ${LANDING_DIR}`);
}

main().catch(console.error);
