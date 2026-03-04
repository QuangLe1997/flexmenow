const https = require('https');
const zlib = require('zlib');
const cfg = require('C:/Users/Labs/.config/configstore/firebase-tools.json');

function getToken() {
  return new Promise((resolve, reject) => {
    const body = 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(cfg.tokens.refresh_token) +
      '&client_id=563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com&client_secret=j9iVZfS8kkCEFUPaAeJV0sAi';
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d).access_token));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function main() {
  const token = await getToken();
  console.log('Token refreshed OK');

  // GET current config + ETag
  const getResult = await new Promise((resolve, reject) => {
    https.get({
      hostname: 'firebaseremoteconfig.googleapis.com',
      path: '/v1/projects/flexme-now/remoteConfig',
      headers: { 'Authorization': 'Bearer ' + token, 'Accept-Encoding': 'gzip' }
    }, res => {
      const etag = res.headers['etag'];
      const gunzip = zlib.createGunzip();
      let d = '';
      res.pipe(gunzip);
      gunzip.on('data', c => d += c);
      gunzip.on('end', () => resolve({ data: JSON.parse(d), etag }));
    }).on('error', reject);
  });

  console.log('GET OK, etag:', getResult.etag, 'current params:', Object.keys(getResult.data.parameters || {}).length);

  // Update params
  const data = getResult.data;
  if (!data.parameters) data.parameters = {};

  Object.assign(data.parameters, {
    wow_everyday_enabled: { defaultValue: { value: 'true' } },
    search_enabled: { defaultValue: { value: 'true' } },
    search_supported_langs: { defaultValue: { value: 'en,vi,es,pt' } },
    ai_chat_enabled: { defaultValue: { value: 'true' } },
    flexlocket_enabled: { defaultValue: { value: 'true' } },
    maintenance_mode: { defaultValue: { value: 'false' } },
    default_template_credits: { defaultValue: { value: '1' } },
    premium_template_credits: { defaultValue: { value: '2' } },
    new_user_free_credits: { defaultValue: { value: '12' } },
    daily_free_glow_limit: { defaultValue: { value: '10' } },
    glow_credit_cost: { defaultValue: { value: '0.5' } },
    paywall_variant: { defaultValue: { value: 'A' } },
    paywall_show_trial: { defaultValue: { value: 'true' } },
    paywall_trial_days: { defaultValue: { value: '3' } },
  });

  // PUT updated config
  const putBody = JSON.stringify(data);
  const putResult = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'firebaseremoteconfig.googleapis.com',
      path: '/v1/projects/flexme-now/remoteConfig',
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json; UTF-8',
        'If-Match': getResult.etag,
        'Content-Length': Buffer.byteLength(putBody),
      }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ data: JSON.parse(d), status: res.statusCode }));
    });
    req.on('error', reject); req.write(putBody); req.end();
  });

  console.log('PUT status:', putResult.status);
  if (putResult.data.parameters) {
    const keys = Object.keys(putResult.data.parameters);
    console.log('SUCCESS!', keys.length, 'params set:');
    keys.forEach(k => console.log('  ' + k + ' = ' + (putResult.data.parameters[k].defaultValue?.value || '').slice(0, 80)));
  } else {
    console.log('Error:', JSON.stringify(putResult.data).slice(0, 500));
  }
}

main().catch(console.error);
