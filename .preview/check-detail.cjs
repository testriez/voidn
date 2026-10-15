const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const pause = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--hide-scrollbars','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9225','--user-data-dir='+path.join(__dirname,'detail-chrome-profile'),'about:blank'], {windowsHide:true,stdio:'ignore'});
  let targets;
  for(let i=0;i<40;i++){try{targets=await(await fetch('http://127.0.0.1:9225/json')).json();break;}catch{await pause(250);}}
  if(!targets)throw new Error('Chrome unavailable');
  const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0;const pending=new Map(),errors=[],report=[];
  ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);if(m.method==='Network.loadingFailed'&&!m.params.canceled)errors.push(m.params);if(m.method==='Network.responseReceived'&&m.params.response.status>=400&&!m.params.response.url.endsWith('/favicon.ico'))errors.push(m.params.response);});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  const screenshot=async(name,width,height)=>{const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});fs.writeFileSync(path.join(__dirname,name),Buffer.from(shot.data,'base64'));};
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
  for(const width of [1920,768,360]){
    const height=width===360?803:1008;
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:'http://127.0.0.1:4173/detail.html'});await pause(1800);await evaluate('document.fonts.ready.then(()=>true)');
    const geometry=await evaluate(`JSON.stringify({width:innerWidth,height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].map(i=>({src:i.getAttribute('src'),ok:i.complete&&i.naturalWidth>0})),boxes:Object.fromEntries(['header','.product','.product-gallery','.th-huge','.product-summary','.product-purchase','.product-options','footer'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{x:r.x,y:r.y,w:r.width,h:r.height}]}))})`);
    await screenshot('detail-'+width+'.png',width,JSON.parse(geometry).height);
    await evaluate('document.querySelector(".fitting-actions .try-on").click()');
    await pause(110);
    const moving=await evaluate('document.querySelector(".fitting-modal").getBoundingClientRect().left');
    await pause(300);
    const modal=await evaluate(`JSON.stringify({open:document.querySelector('dialog').open,x:document.querySelector('dialog').getBoundingClientRect().left,width:document.querySelector('dialog').offsetWidth,height:document.querySelector('dialog').offsetHeight,dim:getComputedStyle(document.querySelector('dialog'),'::backdrop').opacity,locked:document.body.classList.contains('modal-open'),avatarY:document.querySelector('.th-avatar').getBoundingClientRect().top,focusInside:document.querySelector('dialog').contains(document.activeElement)})`);
    await screenshot('fitting-'+width+'.png',width,height);
    await evaluate(`document.querySelector('.profile-toggle').click();document.querySelector('.outfit-item input').click();document.querySelector('[name="fitting-size"]').value='M';`);
    const state=await evaluate(`JSON.stringify({profileHidden:document.querySelector('.profile-details').hidden,checkbox:document.querySelector('.outfit-item input').checked,size:document.querySelector('[name="fitting-size"]').value})`);
    if(width>360){
      await call('Input.dispatchMouseEvent',{type:'mousePressed',x:10,y:100,button:'left',clickCount:1});
      await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:10,y:100,button:'left',clickCount:1});
    }else{await evaluate('document.querySelector("dialog .close").click()');}
    await pause(350);
    const closed=await evaluate('!document.querySelector("dialog").open&&!document.body.classList.contains("modal-open")');
    await evaluate('document.querySelector(".fitting-actions .try-on").click()');await pause(350);
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pause(350);
    const escapeClosed=await evaluate('!document.querySelector("dialog").open');
    await evaluate(`document.querySelectorAll('.th-tiny[data-image]')[1].click();document.querySelectorAll('.color')[1].click();document.querySelector('.product-outfit .outfit-toggle').click();document.querySelector('button.fitting-info').click();`);
    const controls=await evaluate(`JSON.stringify({image:document.querySelector('.product-image').getAttribute('src'),color:document.querySelectorAll('.color')[1].classList.contains('active'),outfits:!document.querySelector('.product-outfit .outfit-list').hidden,tooltipHidden:document.querySelector('.tooltip').hidden})`);
    report.push({geometry:JSON.parse(geometry),moving,modal:JSON.parse(modal),state:JSON.parse(state),closed,escapeClosed,controls:JSON.parse(controls)});
  }
  await call('Page.navigate',{url:'http://127.0.0.1:4173/index.html'});await pause(1000);
  const indexRegression=await evaluate(`document.querySelector('.swiper-button-next').click();document.querySelector('.tab').click();JSON.stringify({slide:document.querySelector('.current').textContent,tab:document.querySelector('.tab.active').textContent})`);
  fs.writeFileSync(path.join(__dirname,'detail-report.json'),JSON.stringify({report,errors,indexRegression:JSON.parse(indexRegression)},null,2));
  console.log(JSON.stringify({report,errors,indexRegression:JSON.parse(indexRegression)}));
  await call('Browser.close');ws.close();browser.unref();
})().catch(e=>{console.error(e);process.exit(1);});
