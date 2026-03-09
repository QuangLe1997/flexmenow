const admin = require('firebase-admin');

// Use ADC (gcloud auth application-default)
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'flexme-now' });
}
const db = admin.firestore();

async function check() {
  const enh = await db.collection('enhancements').limit(3).get();
  console.log('enhancements:', enh.size);
  enh.forEach(d => {
    const data = d.data();
    console.log('  -', d.id, '| status:', data.status, '| userId:', (data.userId || '').substring(0,10), '| output:', (data.outputImageUrl || 'none').substring(0,60));
  });

  const gen = await db.collection('generations').limit(3).get();
  console.log('generations:', gen.size);
  gen.forEach(d => {
    const data = d.data();
    console.log('  -', d.id, '| status:', data.status, '| userId:', (data.userId || '').substring(0,10), '| output:', (data.outputImageUrl || 'none').substring(0,60));
  });

  const stories = await db.collection('stories').limit(3).get();
  console.log('stories:', stories.size);
  stories.forEach(d => {
    const data = d.data();
    console.log('  -', d.id, '| status:', data.status, '| userId:', (data.userId || '').substring(0,10), '| scenes:', data.totalScenes, '/', data.completedScenes);
  });
}
check().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
