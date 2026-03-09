const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'flexme-now' });
const db = admin.firestore();

async function check() {
  const meta = await db.collection('cms_meta').doc('templates').get();
  if (meta.exists) {
    const d = meta.data();
    console.log('cms_meta/templates EXISTS');
    console.log('  version:', d.version);
    console.log('  categories count:', (d.categories || []).length);
    console.log('  types count:', (d.types || []).length);
    console.log('  genders count:', (d.genders || []).length);
    if (d.categories && d.categories.length > 0) {
      console.log('  first 3 categories:', JSON.stringify(d.categories.slice(0,3)));
    }
  } else {
    console.log('cms_meta/templates DOES NOT EXIST');
  }

  const count = await db.collection('cms_templates').count().get();
  console.log('\ncms_templates count:', count.data().count);

  if (count.data().count > 0) {
    const snap = await db.collection('cms_templates').limit(3).get();
    snap.forEach(doc => {
      const d = doc.data();
      console.log('  ', doc.id, '| name.en:', d.name?.en || '?', '| cat:', d.category || '?');
    });
  }
}
check().catch(console.error);
