// A18 isolated Chrome/CDP regression; zero npm dependencies.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const qa=process.env.A18_QA_DIR||path.join(os.tmpdir(),'a18-v03-qa');
fs.mkdirSync(qa,{recursive:true});
const port=18893,debugPort=19243;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),candidate=path.resolve(repo,'.'+decodeURIComponent(u.pathname));
 if(!candidate.startsWith(repo+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(candidate,(err,body)=>{
  if(err){res.writeHead(404).end(String(err));return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(candidate)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
 });
});
await new Promise(ok=>server.listen(port,'127.0.0.1',ok));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'a18-chrome-qa-'));
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=spawn(chrome,['--headless=new','--no-first-run','--disable-extensions','--disable-gpu','--hide-scrollbars','--remote-allow-origins=*','--remote-debugging-port='+debugPort,'--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws,seq=0;const pending=new Map(),errors=[],checks=[];
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const assert=(ok,msg)=>{if(!ok)throw Error(msg);return true;};
async function check(name,fn){
 try{const value=await fn();assert(value,'false result');checks.push({name,pass:true});}
 catch(e){checks.push({name,pass:false,error:String(e)});throw e;}
}
async function cmd(method,params={}){
 const id=++seq;return new Promise((resolve,reject)=>{
  pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
 });
}
async function evaluate(source){
 const r=await cmd('Runtime.evaluate',{expression:'(async()=>{'+source+'})()',returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails).slice(0,650));
 return r.result?.value;
}
async function poll(fn,max=150){
 for(let i=0;i<max;i++){try{const v=await fn();if(v)return v;}catch{}await sleep(100);}
 throw Error('Timed out waiting');
}
const state=()=>evaluate('return window.__A18_SCENE_STUDY__?.state();');
const click=id=>evaluate("const e=document.getElementById('"+id+"');if(!e)throw Error('Missing element');e.click();return true;");
async function press(key){
 const n={ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40}[key];
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:n});
 await cmd('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:n});
}
async function repeat(key,n){for(let i=0;i<n;i++)await press(key);}
async function until(room,key,n=52){
 for(let i=0;i<n;i++){await press(key);if((await state()).galleryIndex===room)return true;}
 throw Error('Portal failed '+room+' '+key+' '+JSON.stringify((await state()).pos));
}
async function shot(filename){
 const r=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(path.join(qa,filename),Buffer.from(r.data,'base64'));
}
const report={started:new Date().toISOString(),repo,checks,errors};
try{
 await poll(async()=>{try{return (await fetch('http://127.0.0.1:'+debugPort+'/json/version')).ok;}catch{return false;}},150);
 const target=await (await fetch('http://127.0.0.1:'+debugPort+'/json/new?'+encodeURIComponent('http://127.0.0.1:'+port+'/a18/layout-test/index.html'),{method:'PUT'})).json();
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,bad)=>{ws.onopen=ok;ws.onerror=bad;});
 ws.onmessage=msg=>{
  const p=JSON.parse(msg.data);
  if(p.id){const q=pending.get(p.id);if(q){pending.delete(p.id);p.error?q.reject(Error(JSON.stringify(p.error))):q.resolve(p.result||{});}}
  else if(p.method==='Runtime.exceptionThrown')errors.push(p.params?.exceptionDetails?.text||'exception');
 };
 await cmd('Runtime.enable');await cmd('Page.enable');
 await cmd('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
 await poll(()=>evaluate('return window.__A18_SCENE_STUDY__?.ready()===true;'),200);
 await evaluate("const a=document.getElementById('confirmName');if(a){document.getElementById('a18PlayerName').value='QA館長';document.getElementById('a18MuseumTitle').value='QA美術館';a.click();document.getElementById('skipTour')?.click();}return true;");
 await sleep(500);
 await check('15 PNG loaded, 48 characters preserved',async()=>assert((await evaluate('return window.A18Entrance.assetCount();'))===15&&(await state()).assetStatus.loaded===48,'image count'));
 await check('3 frame fixtures and 6 rooms',async()=>assert((await state()).frameRects.length===3&&Object.keys((await state()).allRoomLinks).length===6,'map'));
 await check('landscape, portrait, square and narrow frame geometry',async()=>{
  const arr=await evaluate("const f=window.__A18_SCENE_STUDY__.state().fixtures[0];return [{w:160,h:95,s:'landscape'},{w:80,h:120,s:'portrait'},{w:96,h:96,s:'square'},{w:14,h:140,s:'portrait'}].map(t=>{const g=window.A18Entrance.frameGeometry(f,{naturalWidth:t.w,naturalHeight:t.h},t.s);return {w:g.outer.w,h:g.outer.h,r:g.inner.w/g.inner.h,expected:t.w/t.h};});");
  return assert(arr.every(p=>p.w>=40&&p.h>=40&&p.h<=165&&Math.abs(p.r-p.expected)<.001),JSON.stringify(arr));
 });
 await shot('pc_entrance_v03_initial.png');
 await check('walk west and return',async()=>{await repeat('ArrowUp',3);await until(1,'ArrowLeft',40);await until(0,'ArrowRight',12);return true;});
 await check('walk east and return',async()=>{await until(2,'ArrowRight',42);await until(0,'ArrowLeft',12);return true;});
 await check('walk north and return',async()=>{await repeat('ArrowLeft',9);await until(5,'ArrowUp',35);await until(0,'ArrowDown',8);return true;});
 await check('walk to butler and conversation',async()=>{
  await repeat('ArrowDown',15);await repeat('ArrowLeft',15);
  assert((await state()).interaction?.type==='butler','butler not reached');
  await click('act');await click('rpgAdvance');await click('staffChat');await click('returnMenu');await click('staffRegister');
  return assert(await evaluate("return !!document.getElementById('photo');"),'registration modal');
 });
 await check('register photo with original and memo',async()=>{
  await evaluate("document.getElementById('name').value='QA風景';document.getElementById('notes').value='忘れたくない思い出';document.getElementById('pieces').value='500';const c=document.createElement('canvas');c.width=160;c.height=100;const x=c.getContext('2d');x.fillStyle='#4686be';x.fillRect(0,0,160,100);const file=await new Promise(ok=>c.toBlob(b=>ok(new File([b],'qa-landscape.png',{type:'image/png'})),'image/png'));const dt=new DataTransfer();dt.items.add(file);document.getElementById('photo').files=dt.files;document.getElementById('save').click();return true;");
  await poll(()=>evaluate("return !!document.getElementById('offerNo');"));
  await click('offerNo');await click('receiveWork');
  const s=await state();return assert(s.works.length===1&&s.works[0].notes==='忘れたくない思い出'&&s.carrying===s.works[0].id,'registration');
 });
 await check('display and restore IndexedDB original Blob',async()=>{
  await evaluate('window.__A18_SCENE_STUDY__.inspect(0);return true;');
  await sleep(700);
  assert((await state()).works[0].fixtureId==='frame-0-0','frame display failed');
  await cmd('Page.reload',{ignoreCache:true});
  try{await poll(()=>evaluate('return window.__A18_SCENE_STUDY__?.ready()===true;'),200);}catch(e){const diag=await evaluate("return {url:location.href,ready:document.readyState,hint:document.getElementById('hint')?.textContent,hasStudy:!!window.__A18_SCENE_STUDY__,html:document.body?.innerText?.slice(0,300)};");throw Error('Reload diagnostic: '+JSON.stringify(diag)+' / '+e.message);}
  const s=await state();
  const r=await evaluate("const s=await window.A18Storage.load();return {size:s.works[0].originalBlob.size,notes:s.works[0].notes,player:s.playerName,pieces:s.works[0].pieces};");
  return assert(s.works[0].fixtureId==='frame-0-0'&&r.size>100&&r.notes==='忘れたくない思い出'&&r.player==='QA館長'&&r.pieces===500,JSON.stringify(r));
 });
 await shot('pc_entrance_v03_with_work.png');
 await check('view photo and return',async()=>{
  await evaluate('window.__A18_SCENE_STUDY__.inspect(0);return true;');
  await click('inspectPhoto');assert(await evaluate("return !document.getElementById('photoViewer').hidden;"),'viewer');
  await click('photoClose');return true;
 });

 await check('register portrait photo for exchange',async()=>{
  await evaluate("document.getElementById('close')?.click();window.__A18_SCENE_STUDY__.butlerDialog();return true;");
  await click('rpgAdvance');await click('staffRegister');
  await evaluate("document.getElementById('name').value='QA人物';const c=document.createElement('canvas');c.width=80;c.height=120;const x=c.getContext('2d');x.fillStyle='#9a5375';x.fillRect(0,0,80,120);const f=await new Promise(ok=>c.toBlob(b=>ok(new File([b],'qa-portrait.png',{type:'image/png'})),'image/png'));const dt=new DataTransfer();dt.items.add(f);document.getElementById('photo').files=dt.files;document.getElementById('save').click();return true;");
  await poll(()=>evaluate("return !!document.getElementById('offerNo');"));
  await click('offerNo');await click('receiveWork');
  await evaluate("window.__A18_SCENE_STUDY__.inspect(1);return true;");
  return assert((await state()).works.length===2&&(await state()).works[1].fixtureId==='frame-0-1','portrait register');
 });
 await shot('pc_entrance_v03_landscape_portrait.png');
 await check('pickup, re-display and delete',async()=>{
  await evaluate('window.__A18_SCENE_STUDY__.inspect(0);return true;');await click('lift');
  assert((await state()).carrying,'pickup');
  await evaluate('window.__A18_SCENE_STUDY__.inspect(1);return true;');
  let swapped=await state();
  assert(swapped.works[0].fixtureId==='frame-0-1'&&swapped.works[1].fixtureId===null&&swapped.carrying===swapped.works[1].id,'exchange');
  await evaluate('window.__A18_SCENE_STUDY__.inspect(2);return true;');
  assert((await state()).works[1].fixtureId==='frame-0-2','re-display');
  await evaluate('window.__A18_SCENE_STUDY__.list();return true;');
  for(let n=0;n<2;n++){
   await evaluate("document.querySelector('[data-delete-work]').click();return true;");
   await click('confirmDelete');
   await poll(async()=>(await state()).works.length===1-n);
  }
  return true;
 });
 await check('all five other galleries render unchanged',async()=>{
  for(let room=1;room<6;room++){
   await evaluate("window.__A18_SCENE_STUDY__.changeScene("+room+");return true;");
   const s=await state();assert(s.galleryIndex===room&&s.frameRects.length===5,'gallery regression '+room);
   if(room===1)await shot('pc_gallery2_regression.png');
  }
  await evaluate('window.__A18_SCENE_STUDY__.changeScene(0);return true;');
  return true;
 });
 await check('390x844 portrait viewport and screenshot',async()=>{
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await cmd('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await evaluate("document.getElementById('close')?.click();return true;");
  await sleep(550);await shot('mobile_390x844_v03.png');
  const v=await evaluate("const b=document.getElementById('world').getBoundingClientRect();return {w:b.width,h:b.height,viewport:innerWidth,scroll:document.documentElement.scrollWidth};");
  return assert(v.w>0&&v.w<=v.viewport&&v.scroll<=v.viewport+2,JSON.stringify(v));
 });
 report.success=true;
}catch(e){report.success=false;report.fatal=e.stack||String(e);}
finally{
 report.finished=new Date().toISOString();fs.writeFileSync(path.join(qa,'pc_browser_qa_v03.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({success:report.success,checks,errors,qa,fatal:report.fatal},null,2));
 try{ws?.close();}catch{}
 browser.kill();server.close();
 await sleep(450);
 try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch(e){console.warn('QA browser profile cleanup:',e.message);}
}