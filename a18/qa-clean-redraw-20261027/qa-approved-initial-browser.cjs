const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict');
const qa=__dirname,chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',port=18949;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=cp.spawn('python',['-m','http.server','18872','--bind','127.0.0.1','--directory',path.resolve(qa,'../..')],{stdio:'ignore'});
async function run(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a18-approved-initial-cdp-'));
 const ch=cp.spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-extensions','--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
 try{
  let list;
  for(let i=0;i<50;i++){try{list=await(await fetch('http://127.0.0.1:'+port+'/json')).json();break;}catch{await sleep(200);}}
  assert(list,'CHROME_UNAVAILABLE');
  const ws=new WebSocket(list.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  const pending=new Map(),errors=[],fails=[];let id=0;
  ws.onmessage=e=>{
   const m=JSON.parse(e.data.toString());
   if(m.method==='Runtime.exceptionThrown')errors.push(m.params?.exceptionDetails?.text);
   if(m.method==='Network.loadingFailed'&&!m.params.canceled)fails.push(m.params.errorText);
   if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}
  };
  const send=(method,params={})=>new Promise((resolve,reject)=>{let i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}));});
  async function evalJS(src){const r=await send('Runtime.evaluate',{expression:src,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await send('Page.navigate',{url:'http://127.0.0.1:18872/a18/layout-test/index.html?v=approved-initial-isolated-qa'});
  let ready=false;
  for(let i=0;i<70;i++){await sleep(150);try{ready=await evalJS('!!window.A18Entrance?.ready()');}catch{}if(ready)break;}
  assert(ready,'ENTRANCE_ASSETS_DID_NOT_LOAD '+errors);
  const result=await evalJS('('+async function(){
    const source='assets/entrance/approved_initial_20261027/entrance_background_initial_approved.png';
    const im=new Image();im.src=source;await im.decode();
    const c=document.createElement('canvas');c.width=546;c.height=483;
    const cx=c.getContext('2d');window.A18Entrance.background(cx);
    const rendered=c.toDataURL('image/png').split(',')[1];
    const geometry=window.A18Entrance.frameGeometry({id:'frame-0-2',roomId:0},null);
    return {background:{width:im.naturalWidth,height:im.naturalHeight,complete:im.complete},
      assetCount:window.A18Entrance.assetCount(),geometry,sceneReady:!!window.__A18_SCENE_STUDY__?.ready(),
      image:rendered};
  }.toString()+')()');
  const bytes=Buffer.from(result.image,'base64');delete result.image;
  fs.writeFileSync(path.join(qa,'approved-initial-browser-render-546x483.png'),bytes);
  await evalJS("(()=>{document.getElementById('overlay').hidden=true;return true})()");
  await sleep(250);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(qa,'approved-initial-browser-mobile-390x844.png'),Buffer.from(shot.data,'base64'));
  assert.deepEqual([result.background.width,result.background.height],[1322,1190]);
  assert.equal(result.assetCount,5,'new approved base + 3 legacy masks + atlas');
  assert.equal(result.geometry.outer.x,421);
  assert.equal(result.geometry.outer.y,195);
  assert(bytes.length>150000);
  assert.equal(errors.length,0,'browser JS exceptions '+JSON.stringify(errors));
  assert.equal(fails.length,0,'network failed '+JSON.stringify(fails));
  const report={status:'PASS',result,jsExceptions:errors,networkErrors:fails,server:'local loopback isolated Chrome'};
  fs.writeFileSync(path.join(qa,'approved-initial-browser-results.json'),JSON.stringify(report,null,2));
  console.log('APPROVED_INITIAL_BROWSER_QA_PASS',JSON.stringify(result), 'renderPNG',bytes.length,'bytes');
  ws.close();
 }finally{ch.kill();server.kill();await sleep(400);}
}
run().catch(e=>{console.error('APPROVED_INITIAL_BROWSER_QA_FAILED',e);process.exitCode=1;});
