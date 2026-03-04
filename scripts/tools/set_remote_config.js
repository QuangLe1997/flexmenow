const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();

async function main() {
  const token = await admin.app().options.credential.getAccessToken();
  const projectId = 'flexme-now';

  // GET current Remote Config
  const data = await new Promise((resolve, reject) => {
    const opts = {
      hostname: 'firebaseremoteconfig.googleapis.com',
      path: '/v1/projects/' + projectId + '/remoteConfig',
      headers: {
        'Authorization': 'Bearer ' + token.access_token,
        'Accept-Encoding': 'gzip',
      }
    };
    https.get(opts, (res) => {
      let body = '';
      const etag = res.headers['etag'];
      res.on('data', c => body += c);
      res.on('end', () => {
        console.log('GET status:', res.statusCode, 'etag:', etag);
        try { resolve({ config: JSON.parse(body), etag }); }
        catch(e) { resolve({ config: { parameters: {} }, etag }); }
      });
    }).on('error', reject);
  });

  const etag = data.etag || '*';
  const config = data.config;
  if (!config.parameters) config.parameters = {};

  const tplUrl = 'https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/config%2Fflexshot_templates.json?alt=media';
  const storyUrl = 'https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/config%2Fflextale_stories.json?alt=media';
  const onbUrl = 'https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/config%2Fonboarding_US.json?alt=media';

  config.parameters['flexshot_json_url'] = { defaultValue: { value: tplUrl } };
  config.parameters['flextale_json_url'] = { defaultValue: { value: storyUrl } };
  config.parameters['onboarding_json_url'] = { defaultValue: { value: onbUrl } };

  const putBody = JSON.stringify(config);
  const result = await new Promise((resolve, reject) => {
    const opts = {
      hostname: 'firebaseremoteconfig.googleapis.com',
      path: '/v1/projects/' + projectId + '/remoteConfig',
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token.access_token,
        'Content-Type': 'application/json; UTF-8',
        'If-Match': etag,
        'Content-Length': Buffer.byteLength(putBody),
      }
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(putBody);
    req.end();
  });

  console.log('PUT status:', result.status);
  if (result.status === 200) {
    console.log('Remote Config updated with JSON URLs!');
    console.log('  flexshot_json_url:', tplUrl);
    console.log('  flextale_json_url:', storyUrl);
    console.log('  onboarding_json_url:', onbUrl);
  } else {
    console.log('Error:', result.body.substring(0, 500));
  }
}

main().catch(e => console.error(e));
