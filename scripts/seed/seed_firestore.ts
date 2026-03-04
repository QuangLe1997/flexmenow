/**
 * Seed Firestore with templates and story packs from JSON config files.
 *
 * Reads public/config/flexshot_templates.json and flextale_stories.json,
 * then writes to Firestore collections `templates` and `storyPacks` (with scenes subcollection).
 *
 * Usage:
 *   npx ts-node seed/seed_firestore.ts
 *   npx ts-node seed/seed_firestore.ts --dry-run
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var or run from a gcloud-authenticated env.
 */

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const PROJECT_ID = "flexme-now";

// Init Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

// ──────────────────────────────────────────────
// Seed FlexShot templates → Firestore `templates`
// ──────────────────────────────────────────────
async function seedTemplates() {
  const jsonPath = path.resolve(__dirname, "../../public/config/flexshot_templates.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`[templates] File not found: ${jsonPath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const templates: any[] = data.templates;

  if (!templates || templates.length === 0) {
    console.error("[templates] No templates found in JSON");
    return;
  }

  console.log(`[templates] Found ${templates.length} templates`);

  const batch = db.batch();

  for (const t of templates) {
    // Map JSON structure to what gen_flexshot.ts expects
    const doc: Record<string, any> = {
      name: typeof t.name === "object" ? t.name.en : t.name,
      nameI18n: t.name,
      category: t.category,
      type: t.type,
      gender: t.gender,
      style: t.style,
      credits: t.credits,
      badge: t.badge || null,
      isPremium: t.premium === true,
      isActive: t.isActive !== false,
      sortOrder: t.sortOrder || 0,
      coverImage: t.coverImage || null,
      previewImages: t.previewImages || [],
      // Fields used by gen_flexshot.ts
      promptTemplate: t.prompt?.base || "",
      negativePrompt: t.prompt?.negative || "",
      styleHint: t.prompt?.styleHint || "",
      imagenParams: {
        guidanceScale: t.aiConfig?.guidanceScale || 7.5,
        aspectRatio: t.aiConfig?.aspectRatio || "1:1",
        safetyFilterLevel: t.aiConfig?.safetyFilterLevel || "BLOCK_MEDIUM_AND_ABOVE",
        numberOfImages: t.aiConfig?.numberOfImages || 1,
        model: t.aiConfig?.model || "imagen-3.0-generate-001",
        referenceType: t.aiConfig?.referenceType || "SUBJECT_REFERENCE",
      },
      stats: t.stats || { likes: 0, views: 0, generates: 0 },
      tags: t.tags || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (DRY_RUN) {
      console.log(`  [dry-run] templates/${t.id}:`, JSON.stringify(doc, null, 2).substring(0, 200));
    } else {
      const ref = db.collection("templates").doc(t.id);
      batch.set(ref, doc, { merge: true });
    }
  }

  if (!DRY_RUN) {
    await batch.commit();
    console.log(`[templates] ✓ Seeded ${templates.length} templates to Firestore`);
  } else {
    console.log(`[templates] [dry-run] Would seed ${templates.length} templates`);
  }
}

// ──────────────────────────────────────────────
// Seed FlexTale stories → Firestore `storyPacks` + `storyPacks/{id}/scenes`
// ──────────────────────────────────────────────
async function seedStoryPacks() {
  const jsonPath = path.resolve(__dirname, "../../public/config/flextale_stories.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`[storyPacks] File not found: ${jsonPath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const stories: any[] = data.stories;

  if (!stories || stories.length === 0) {
    console.error("[storyPacks] No stories found in JSON");
    return;
  }

  console.log(`[storyPacks] Found ${stories.length} story packs`);

  for (const story of stories) {
    const chapters: any[] = story.chapters || [];

    // Story pack doc
    const packDoc: Record<string, any> = {
      name: typeof story.title === "object" ? story.title.en : (story.title || story.name?.en || story.name),
      nameI18n: story.title || story.name,
      description: typeof story.description === "object" ? story.description.en : story.description,
      descriptionI18n: story.description,
      category: (story.category || "travel").toLowerCase(),
      type: story.type,
      gender: story.gender,
      totalScenes: chapters.length,
      creditsCost: story.credits || (5 + chapters.length),
      isPremium: story.premium === true,
      isActive: story.isActive !== false,
      sortOrder: story.sortOrder || 0,
      coverImage: story.coverImage || null,
      previewUrls: story.previewImages || [],
      badge: story.badge || null,
      usageCount: story.uses || 0,
      tags: story.tags || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (DRY_RUN) {
      console.log(`  [dry-run] storyPacks/${story.id}:`, JSON.stringify(packDoc, null, 2).substring(0, 200));
      console.log(`    chapters: ${chapters.length}`);
    } else {
      const packRef = db.collection("storyPacks").doc(story.id);
      await packRef.set(packDoc, { merge: true });

      // Seed scenes subcollection
      const scenesBatch = db.batch();
      for (const ch of chapters) {
        const sceneDoc: Record<string, any> = {
          sceneOrder: ch.order,
          sceneName: typeof ch.heading === "object" ? ch.heading.en : ch.heading,
          sceneNameI18n: ch.heading,
          promptTemplate: ch.prompt?.base || "",
          negativePrompt: ch.prompt?.negative || "",
          styleHint: ch.prompt?.styleHint || "",
          imagenParams: {
            guidanceScale: ch.aiConfig?.guidanceScale || 8.0,
            aspectRatio: ch.aiConfig?.aspectRatio || "3:4",
          },
        };
        const sceneRef = packRef.collection("scenes").doc(`scene_${ch.order}`);
        scenesBatch.set(sceneRef, sceneDoc, { merge: true });
      }
      await scenesBatch.commit();
      console.log(`  ✓ storyPacks/${story.id} — ${chapters.length} scenes`);
    }
  }

  if (DRY_RUN) {
    console.log(`[storyPacks] [dry-run] Would seed ${stories.length} story packs`);
  } else {
    console.log(`[storyPacks] ✓ Seeded ${stories.length} story packs to Firestore`);
  }
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  console.log(`\n🌱 Seeding Firestore (project: ${PROJECT_ID})${DRY_RUN ? " [DRY RUN]" : ""}\n`);

  await seedTemplates();
  console.log();
  await seedStoryPacks();

  console.log("\n✅ Done!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
