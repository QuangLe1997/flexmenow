const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) admin.initializeApp({ projectId: 'flexme-now' });
const db = admin.firestore();

async function syncCms() {
  const jsonPath = path.join(__dirname, '..', 'public', 'config', 'flexshot_templates.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log('\n=== SYNC JSON → cms_meta/templates + cms_templates ===\n');

  // 1. Update cms_meta/templates with categories, types, genders from JSON
  const meta = {
    version: jsonData.version,
    updatedAt: jsonData.updatedAt,
    imageBaseUrl: jsonData.imageBaseUrl,
    imageSuffix: jsonData.imageSuffix,
    defaults: jsonData.defaults,
    categories: jsonData.categories,
    types: jsonData.types,
    genders: jsonData.genders,
  };
  await db.collection('cms_meta').doc('templates').set(meta, { merge: true });
  console.log('✓ cms_meta/templates updated');
  console.log('  categories:', jsonData.categories.length);
  console.log('  types:', jsonData.types.length);
  console.log('  genders:', jsonData.genders.length);

  // 2. Sync all 200 templates to cms_templates
  const templates = jsonData.templates;
  console.log(`\nSyncing ${templates.length} templates to cms_templates...`);

  // Batch write (max 500 per batch)
  const batch = db.batch();
  for (const t of templates) {
    const ref = db.collection('cms_templates').doc(t.id);
    batch.set(ref, t, { merge: true });
  }
  await batch.commit();
  console.log(`✓ ${templates.length} templates synced to cms_templates`);

  // 3. Also sync to CF `templates` collection
  const batch2 = db.batch();
  for (const t of templates) {
    const ref = db.collection('templates').doc(t.id);
    batch2.set(ref, {
      ...t,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  await batch2.commit();
  console.log(`✓ ${templates.length} templates synced to templates (CF)`);

  // Verify
  const metaDoc = await db.collection('cms_meta').doc('templates').get();
  const d = metaDoc.data();
  console.log('\n--- Verification ---');
  console.log('cms_meta categories:', (d.categories || []).map(c => c.id).join(', '));

  const snap = await db.collection('cms_templates').limit(3).get();
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`  ${doc.id}: name.en="${data.name?.en}" cat=${data.category}`);
  });

  console.log('\n=== DONE ===\n');
}

syncCms().catch(console.error);
