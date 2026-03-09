/**
 * Upload flexshot_templates.json to Firebase Storage (GCS)
 * then update Remote Config with cache-busted URL.
 *
 * Usage: node scripts/upload_and_update_rc.js
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const BUCKET_NAME = 'flexme-now.firebasestorage.app';
const GCS_PATH = 'config/flexshot_templates.json';
const RC_KEY = 'flexshot_json_url';
const PUBLIC_URL = `https://storage.googleapis.com/${BUCKET_NAME}/${GCS_PATH}`;

const PROJECT_ID = 'flexme-now';
const RC_HOST = 'firebaseremoteconfig.googleapis.com';
const RC_PATH_URL = `/v1/projects/${PROJECT_ID}/remoteConfig`;

// Firebase CLI OAuth credentials
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
    storageBucket: BUCKET_NAME,
  });
}

async function uploadToStorage() {
  const jsonPath = path.join(__dirname, '..', 'public', 'config', 'flexshot_templates.json');
  const fileContent = fs.readFileSync(jsonPath);
  const sizeKB = (fileContent.length / 1024).toFixed(1);

  console.log(`\n[1/3] Uploading flexshot_templates.json (${sizeKB} KB) to GCS...`);

  const bucket = admin.storage().bucket();
  const file = bucket.file(GCS_PATH);

  await file.save(fileContent, {
    contentType: 'application/json',
    metadata: {
      cacheControl: 'public, max-age=300',
    },
  });

  // Make public
  await file.makePublic();

  console.log(`  -> gs://${BUCKET_NAME}/${GCS_PATH}`);
  console.log(`  -> ${PUBLIC_URL}`);
  return PUBLIC_URL;
}

function getAccessToken() {
  const homedir = process.env.HOME || process.env.USERPROFILE || '';
  const cfgPath = path.join(homedir, '.config', 'configstore', 'firebase-tools.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  const refreshToken = cfg.tokens.refresh_token;

  return new Promise((resolve, reject) => {
    const body =
      `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}` +
      `&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          const parsed = JSON.parse(d);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error('Token refresh failed: ' + d));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getRemoteConfig(token) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: RC_HOST,
      path: RC_PATH_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept-Encoding': 'gzip',
      },
    }, (res) => {
      const etag = res.headers['etag'];
      const gunzip = zlib.createGunzip();
      let d = '';
      res.pipe(gunzip);
      gunzip.on('data', (c) => (d += c));
      gunzip.on('end', () => resolve({ data: JSON.parse(d), etag }));
      gunzip.on('error', reject);
    }).on('error', reject);
  });
}

function putRemoteConfig(token, data, etag) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: RC_HOST,
      path: RC_PATH_URL,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; UTF-8',
        'If-Match': etag,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function updateRemoteConfig(url) {
  console.log('\n[2/3] Updating Remote Config...');

  const cacheBustUrl = `${url}?t=${Date.now()}`;
  console.log(`  Key: ${RC_KEY}`);
  console.log(`  URL: ${cacheBustUrl}`);

  const token = await getAccessToken();
  const { data, etag } = await getRemoteConfig(token);

  if (!data.parameters) data.parameters = {};
  data.parameters[RC_KEY] = { defaultValue: { value: cacheBustUrl } };

  const result = await putRemoteConfig(token, data, etag);
  if (result.status !== 200) {
    throw new Error(`Remote Config PUT failed (${result.status}): ${JSON.stringify(result.data).slice(0, 300)}`);
  }

  console.log('  -> Remote Config updated successfully');
}

async function verify() {
  console.log('\n[3/3] Verifying...');

  const token = await getAccessToken();
  const { data } = await getRemoteConfig(token);
  const val = data.parameters?.[RC_KEY]?.defaultValue?.value || 'NOT SET';
  console.log(`  Remote Config ${RC_KEY} = ${val}`);
}

async function main() {
  console.log('=== Upload FlexShot Templates JSON + Update Remote Config ===');

  const url = await uploadToStorage();
  await updateRemoteConfig(url);
  await verify();

  console.log('\n=== DONE ===\n');
}

main().catch((err) => {
  console.error('FAILED:', err.message || err);
  process.exit(1);
});
