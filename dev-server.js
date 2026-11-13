'use strict';
/* V2 local server: serves this folder and mounts the same API the live site uses (../api).
   Usage: node dev-server.js   (PORT defaults to 5174). Reads ../.env if present. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const PARENT = path.join(__dirname, '..');

try {
  fs.readFileSync(path.join(PARENT, '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(l);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* no .env: fine */ }
if (!process.env.OTP_DEV && !process.env.TWILIO_ACCOUNT_SID) process.env.OTP_DEV = '1';

const api = require(path.join(PARENT, 'api', 'index.js'));
const ROOT = __dirname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const VJ = JSON.parse(fs.readFileSync(path.join(PARENT, 'vercel.json'), 'utf8'));
const SEC = VJ.headers[0].headers;   // same security headers (incl. CSP) as production

http.createServer((req, res) => {
  SEC.forEach((h) => res.setHeader(h.key, h.value));
  const p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith('/api/') || p === '/api') return api(req, res);
  let file = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!file.startsWith(ROOT) || /dev-server\.js$/.test(file)) { res.statusCode = 403; return res.end('Forbidden'); }
  if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(buf);
  });
}).listen(process.env.PORT || 5174, () => console.log('mangalyasutra V2 dev server on http://localhost:' + (process.env.PORT || 5174)));
