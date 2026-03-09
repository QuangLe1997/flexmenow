const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'flexme-now' });
const db = admin.firestore();
const auth = admin.auth();

async function check() {
  const users = await auth.listUsers(5);
  for (const u of users.users) {
    console.log('User:', u.uid.substring(0,12), '|', u.email || u.displayName || 'no-email');

    const enh = await db.collection('enhancements').where('userId','==',u.uid).limit(1).get();
    const gen = await db.collection('generations').where('userId','==',u.uid).limit(1).get();
    const st = await db.collection('stories').where('userId','==',u.uid).limit(1).get();
    console.log('  enhancements:', enh.size, '| generations:', gen.size, '| stories:', st.size);
  }
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
