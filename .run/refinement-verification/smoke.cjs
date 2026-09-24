
const fs = require('node:fs/promises');
const path = require('node:path');
const base = 'http://127.0.0.1:3001/api';
(async () => {
  const statuses = {}, auth = {};
  for (const [name, password] of [['creator', 'Creator@123'], ['restricted', 'User@123']]) {
    const r = await fetch(base + '/auth/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: name + '@socialyolo.local', password}) });
    auth[name] = await r.json(); statuses[name + 'Login'] = r.status;
  }
  const photo = await fs.readFile(path.resolve('image-service/sample_photo.jpg'));
  const form = () => { const fd = new FormData(); fd.append('file', new Blob([photo], {type: 'image/jpeg'}), 'sample.jpg'); return fd; };
  for (const [name, token] of [['missing', null], ['restricted', auth.restricted.accessToken], ['expired', 'invalid-token']]) {
    const r = await fetch(base + '/image-processing/remove-background', {method: 'POST', headers: token ? {Authorization: 'Bearer ' + token} : {}, body: form()}); statuses[name] = r.status;
  }
  const r = await fetch(base + '/image-processing/remove-background?provider=imgly&model=medium', {method: 'POST', headers: {Authorization: 'Bearer ' + auth.creator.accessToken}, body: form(), signal: AbortSignal.timeout(120000)});
  statuses.processing = r.status;
  const result = await r.json();
  if (result.bytes) await fs.writeFile(path.join(__dirname, 'sample-result.png'), Buffer.from(result.bytes, 'base64'));
  delete result.bytes; delete result.url; if (result.file) delete result.file.url;
  statuses.legacyTester = (await fetch('http://127.0.0.1:3000/image-tester.html')).status;
  statuses.providers = (await fetch(base + '/image-processing/providers')).status;
  await fs.writeFile(path.join(__dirname, 'smoke-report.json'), JSON.stringify({statuses, result}, null, 2));
  console.log(JSON.stringify({statuses, result}, null, 2));
  if (statuses.processing !== 200 || statuses.restricted !== 403 || statuses.missing !== 401 || !result.qualityReport) process.exitCode = 1;
})().catch(e => {console.error(e.message); process.exitCode=1});
