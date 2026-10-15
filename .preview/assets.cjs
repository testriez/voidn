const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const css=['default','token','style','responsive'].map(n=>fs.readFileSync('css/'+n+'.css','utf8')).join('\n');
const refs=[...html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('#'));
const bg=[...css.matchAll(/url\("([.][.]\/images\/[^"]+)"\)/g)].map(m=>m[1].slice(3));
const all=[...new Set([...refs,...bg])];
const missing=all.filter(p=>!fs.existsSync(p)||!fs.statSync(p).size);
console.log(JSON.stringify({checked:all.length,missing}));
if(missing.length)process.exitCode=1;
