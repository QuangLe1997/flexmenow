const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'flexme-now' });
}
const db = admin.firestore();

async function syncTemplates() {
  const jsonPath = path.join(__dirname, '..', 'public', 'config', 'flexshot_templates.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const templates = jsonData.templates;

  console.log(`\nSyncing ${templates.length} templates to Firestore...\n`);

  // Firestore batch limit is 500, we have 200 so one batch is fine
  const batch = db.batch();
  const syncFields = [
    'name', 'category', 'type', 'gender', 'promptGender', 'style',
    'credits', 'badge', 'premium', 'isActive', 'sortOrder',
    'coverImage', 'previewImages', 'prompt', 'aiConfig', 'stats',
    'tags', 'createdAt', 'updatedAt'
  ];

  for (const t of templates) {
    const ref = db.collection('templates').doc(t.id);
    const data = {};
    for (const f of syncFields) {
      if (t[f] !== undefined) {
        data[f] = t[f];
      }
    }
    data.syncedAt = admin.firestore.FieldValue.serverTimestamp();
    batch.set(ref, data, { merge: true });
  }

  await batch.commit();
  console.log(`✓ Synced ${templates.length} templates to Firestore`);

  // Verify
  const snapshot = await db.collection('templates').limit(3).get();
  console.log(`\nVerification (first 3):`);
  snapshot.forEach(doc => {
    const d = doc.data();
    console.log(`  ${doc.id}: name.en="${d.name?.en}" | cat=${d.category} | type=${d.type} | premium=${d.premium} | sort=${d.sortOrder}`);
  });

  console.log(`\n=== DONE ===\n`);
}

syncTemplates().catch(console.error);
