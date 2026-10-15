const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err,data) => { if(err){res.writeHead(404).end();return;} const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data); });
});
server.listen(4173,'127.0.0.1');
