const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'flexme-now' });
}
const db = admin.firestore();

async function checkTemplatesSync() {
  // 1. Load JSON
  const jsonPath = path.join(__dirname, '..', 'public', 'config', 'flexshot_templates.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const jsonTemplates = jsonData.templates;
  const jsonIds = new Set(jsonTemplates.map(t => t.id));

  console.log(`\n=== FLEXSHOT TEMPLATES SYNC CHECK ===\n`);
  console.log(`JSON file: ${jsonTemplates.length} templates (${jsonIds.size} unique IDs)`);
  console.log(`JSON version: ${jsonData.version} | updated: ${jsonData.updatedAt}`);

  // 2. Load Firestore templates collection
  const snapshot = await db.collection('templates').get();
  const dbIds = new Set();
  const dbTemplates = [];
  snapshot.forEach(doc => {
    dbIds.add(doc.id);
    dbTemplates.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Firestore: ${dbTemplates.length} templates (${dbIds.size} unique IDs)\n`);

  // 3. Compare
  const inJsonNotDb = [...jsonIds].filter(id => !dbIds.has(id));
  const inDbNotJson = [...dbIds].filter(id => !jsonIds.has(id));
  const inBoth = [...jsonIds].filter(id => dbIds.has(id));

  console.log(`✓ Matching (in both): ${inBoth.length}`);
  console.log(`✗ In JSON but NOT in DB: ${inJsonNotDb.length}`);
  console.log(`✗ In DB but NOT in JSON: ${inDbNotJson.length}`);

  if (inJsonNotDb.length > 0) {
    console.log(`\n--- Missing from Firestore ---`);
    inJsonNotDb.forEach(id => {
      const t = jsonTemplates.find(t => t.id === id);
      console.log(`  ${id}: ${t?.name?.en || '?'} [${t?.category}]`);
    });
  }

  if (inDbNotJson.length > 0) {
    console.log(`\n--- Extra in Firestore (not in JSON) ---`);
    inDbNotJson.forEach(id => {
      const t = dbTemplates.find(t => t.id === id);
      console.log(`  ${id}: ${t?.name?.en || '?'} [${t?.category || '?'}]`);
    });
  }

  // 4. Field comparison for matching items
  if (inBoth.length > 0) {
    console.log(`\n--- Field diffs (sample first 10 matching) ---`);
    const checkFields = ['category', 'type', 'gender', 'style', 'credits', 'premium', 'isActive', 'sortOrder'];
    let diffCount = 0;
    for (const id of inBoth.slice(0, 200)) {
      const jt = jsonTemplates.find(t => t.id === id);
      const dt = dbTemplates.find(t => t.id === id);
      const diffs = [];
      for (const f of checkFields) {
        const jv = jt[f];
        const dv = dt[f];
        if (JSON.stringify(jv) !== JSON.stringify(dv)) {
          diffs.push(`${f}: JSON=${JSON.stringify(jv)} vs DB=${JSON.stringify(dv)}`);
        }
      }
      // Check name.en
      const jName = jt?.name?.en || '';
      const dName = dt?.name?.en || '';
      if (jName !== dName) {
        diffs.push(`name.en: JSON="${jName}" vs DB="${dName}"`);
      }
      if (diffs.length > 0) {
        diffCount++;
        if (diffCount <= 15) {
          console.log(`  ${id}:`);
          diffs.forEach(d => console.log(`    - ${d}`));
        }
      }
    }
    if (diffCount > 15) console.log(`  ... and ${diffCount - 15} more with diffs`);
    if (diffCount === 0) console.log(`  All matching items have identical fields ✓`);
    else console.log(`\n  Total with field differences: ${diffCount}/${inBoth.length}`);
  }

  console.log(`\n=== DONE ===\n`);
}

checkTemplatesSync().catch(console.error);
