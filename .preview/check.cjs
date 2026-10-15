const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const pause = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9224', '--user-data-dir=' + path.join(__dirname,'chrome-profile'), 'about:blank'], {windowsHide:true, stdio:'ignore'});
  let targets;
  for(let i=0;i<40;i++) { try { targets=await (await fetch('http://127.0.0.1:9224/json')).json(); break; } catch { await pause(250); } }
  if(!targets) throw new Error('Chrome debugging endpoint unavailable');
  const ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0; const pending=new Map(); const errors=[];
  ws.addEventListener('message', ({data})=>{const m=JSON.parse(data); if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);} if(m.method==='Runtime.exceptionThrown')errors.push(m.params); if(m.method==='Network.loadingFailed')errors.push(m.params);});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  const report=[];
  for(const width of [1920,768,360]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1080,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:'http://127.0.0.1:4173/'});
    await pause(2200);
    await call('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true});
    const result=await call('Runtime.evaluate',{expression:`JSON.stringify({width:innerWidth,height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].map(i=>({src:i.getAttribute('src'),ok:i.complete&&i.naturalWidth>0,w:i.width,h:i.height})),boxes:Object.fromEntries(['header','.hero','.categories','.new-arrival','.best-item','.promotion','footer'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,{x:r.x,y:r.y,w:r.width,h:r.height}]}))})`,returnByValue:true});
    report.push(JSON.parse(result.result.value));
    const metrics=await call('Page.getLayoutMetrics');
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:metrics.cssContentSize.height,scale:1}});
    fs.writeFileSync(path.join(__dirname,`screen-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  const interaction=await call('Runtime.evaluate',{expression:`document.querySelector('.swiper-button-next').click(); document.querySelector('.tab').click(); JSON.stringify({slide:document.querySelector('.current').textContent,active:document.querySelector('.tab.active').textContent,missingCategoryBlank:getComputedStyle(document.querySelector('.new-arrival .item-list')).visibility})`,returnByValue:true});
  fs.writeFileSync(path.join(__dirname,'report.json'),JSON.stringify({report,errors,interaction:JSON.parse(interaction.result.value)},null,2));
  console.log(JSON.stringify({report,errors,interaction:interaction.result.value}));
  await call('Browser.close'); ws.close(); browser.unref();
})().catch(e=>{console.error(e);process.exit(1);});
