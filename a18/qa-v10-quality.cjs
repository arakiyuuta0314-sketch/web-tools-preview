const fs=require('fs'),assert=require('node:assert/strict');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dir=process.env.TEMP+'\\a18-v10-qa-20261026';
async function main(){
 const list=await (await fetch('http://127.0.0.1:18902/json')).json();
 const page=list.find(x=>x.type==='page');assert(page?.webSocketDebuggerUrl);
 const ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
 const pending=new Map(),exceptions=[],failures=[];let id=0;
 ws.onmessage=e=>{
  const msg=JSON.parse(e.data.toString());
  if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params.exceptionDetails.text);
  if(msg.method==='Network.loadingFailed'&&!msg.params.canceled)failures.push(msg.params.errorText);
  if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}
 };
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}));
 });
 async function evalJS(source){
  const q=await send('Runtime.evaluate',{expression:source,returnByValue:true,awaitPromise:true});
  if(q.exceptionDetails)throw Error('BROWSER_JS '+JSON.stringify(q.exceptionDetails).slice(0,850));
  return q.result.value;
 }
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 const url='http://127.0.0.1:18901/layout-test/index.html?v=v10-qa';
 async function boot(){
  await send('Page.navigate',{url});
  let value=null;
  for(let i=0;i<130;i++){
   await sleep(200);
   value=await evalJS("({ready:!!window.__A18_SCENE_STUDY__?.ready(),entrance:!!window.A18Entrance?.ready()})");
   if(value.ready&&value.entrance)return value;
  }
  throw Error('BOOT_TIMEOUT '+JSON.stringify(value)+' ERRORS '+JSON.stringify(exceptions));
 }
 console.log('BOOT',await boot());
 const seed=await evalJS('('+async function(){
  const P2=window.A18P2Store,prev=await P2.load(),next=P2.copy(prev);
  const mk=(width,height,label,portrait=false)=>{
   const c=document.createElement('canvas');c.width=width;c.height=height;
   const x=c.getContext('2d');
   x.fillStyle='#f1ddb8';x.fillRect(0,0,width,height);
   for(let i=0;i<16;i++){
    x.fillStyle='hsl('+(210+i*12)%360+' 85% '+(33+i*2)+'%)';
    x.fillRect(i*width/16,0,width/16,height*.18);
   }
   x.fillStyle=portrait?'#4d284f':'#174e57';
   x.fillRect(width*.15,height*.22,width*.70,height*.66);
   x.fillStyle='#f6c6a0';x.fillRect(width*.3,height*.28,width*.4,height*.32);
   x.fillStyle='#19334b';x.font='bold '+Math.floor(width*.10)+'px Arial';
   x.textAlign='center';x.fillText(label,width/2,height*.78);
   x.fillStyle='#f8f0df';x.font='bold '+Math.floor(width*.05)+'px Arial';
   x.fillText('HIGH RES IMAGE',width/2,height*.84);
   return c;
  };
  const blobs=await Promise.all([
    new Promise(res=>mk(900,1400,'PORTRAIT',true).toBlob(res,'image/png')),
    new Promise(res=>mk(1600,900,'LANDSCAPE',false).toBlob(res,'image/png')),
    new Promise(res=>mk(1600,900,'FRONT WALL',false).toBlob(res,'image/png'))
  ]);
  next.revision=prev.revision+1;
  next.playerName='QA Player';next.museumTitle='とっておき美術館';
  next.galleryIndex=0;next.pos={x:185,y:425,dir:'up',stride:0};
  next.carrying=null;
  next.progression.events=next.progression.events.map(e=>e.id==='intro-v1'?{...e,status:'seen'}:e);
  for(const f of next.fixtures)if(f.roomId===0)f.workId=null;
  next.works=next.works.filter(w=>w.fixtureId==null||!w.fixtureId.startsWith('frame-0-'));
  const t=document.createElement('canvas');t.width=24;t.height=24;const tc=t.getContext('2d');tc.fillStyle='#ff0000';tc.fillRect(0,0,24,24);
  const lowResDisplaySrc=t.toDataURL('image/png');
  const shape=['portrait','landscape','landscape'];
  const works=blobs.map((blob,i)=>{
   const id='v10-'+i,fixtureId='frame-0-'+i;
   const f=next.fixtures.find(f=>f.id===fixtureId);f.workId=id;
   return {id,title:'V10 render test '+i,notes:'Original resolution must be preserved',
    pieces:100,complete:null,registered:'2026-10-26',preferredShape:shape[i],
    fixtureId,originalBlob:blob,displaySrc:lowResDisplaySrc,thumbnail:null};
  });
  next.works.push(...works);
  P2.validate(next);await P2.commit(prev.revision,next);
  return {revision:next.revision,ids:works.map(w=>w.id),blobSizes:works.map(w=>w.originalBlob.size)};
 }.toString()+')()');
 console.log('SEEDED',seed);
 console.log('RELOADED',await boot());
 await sleep(700);
 const result=await evalJS('('+async function(){
  const q=window.__A18_SCENE_STUDY__,st=q.state();
  const f=st.fixtures.filter(f=>f.roomId===0);
  const dimensions=[],sourceSizes=[],proof=[];
  const works=(await window.A18P2Store.load()).works.filter(w=>w.fixtureId?.startsWith('frame-0-'));
  for(let i=0;i<3;i++){
   const w=works.find(w=>w.fixtureId==='frame-0-'+i);
   if(!w)throw Error('WORK_NOT_PERSISTED '+i);
   const img=new Image(),url=URL.createObjectURL(w.originalBlob);img.src=url;await img.decode();
   const g=window.A18Entrance.frameGeometry(f.find(v=>v.id===w.fixtureId),img,w.preferredShape);
   dimensions.push({i,shape:g.shape,outer:g.outer,inner:g.inner});
   sourceSizes.push({i,w:img.naturalWidth,h:img.naturalHeight});
   const c=document.createElement('canvas');c.width=546;c.height=483;const ctx=c.getContext('2d',{willReadFrequently:true});
   window.A18Entrance.background(ctx);const before=ctx.getImageData(0,0,546,483).data.slice();
   window.A18Entrance.frame(ctx,f.find(v=>v.id===w.fixtureId),img,w.preferredShape);
   const after=ctx.getImageData(0,0,546,483).data;
   let changes=0;
   for(let v=0;v<before.length;v+=4)if(before[v]!==after[v]||before[v+1]!==after[v+1]||before[v+2]!==after[v+2])changes++;
   proof.push({i,changes});URL.revokeObjectURL(url);
  }
  const p=dimensions[0].inner;
  return {scene:st.scene,level:st.unlockedRooms,works:works.length,dimensions,sourceSizes,proof,
   photoAspect:p.w/p.h,portraitExpected:900/1400};
 }.toString()+')()');
 console.log('DRAW_QA',JSON.stringify(result));
 assert.equal(result.works,3);
 assert.equal(result.dimensions[0].shape,'portrait');
 assert(result.dimensions[0].inner.h>result.dimensions[0].inner.w*1.35,'portrait not restored');
 assert(Math.abs(result.photoAspect-result.portraitExpected)<.01,'aspect ratio mismatched');
 assert(result.proof[0].changes>4500&&result.proof[1].changes>7000&&result.proof[2].changes>5000,'photo not composited');
 assert(result.sourceSizes[0].w===900&&result.sourceSizes[1].w===1600,'original image source not used');
 const live=await evalJS('('+function(){
  const q=window.__A18_SCENE_STUDY__,view=q.state().viewport;
  const c=document.getElementById('world'),cx=c.getContext('2d');
  const px=Math.floor((116-view.cameraX)*view.backingWidth/view.logicalW);
  const py=Math.floor((131-view.cameraY)*view.backingWidth/view.logicalW);
  const d=cx.getImageData(px,py,1,1).data;
  return {x:px,y:py,r:d[0],g:d[1],b:d[2],cameraX:view.cameraX,cameraY:view.cameraY};
 }.toString()+')()');
 console.log('ACTUAL_RUNTIME_CANVAS_SAMPLE',JSON.stringify(live));
 // displaySrc is deliberately a 24x24 solid-red preview. The real canvas
 // must NOT display it; portrait art must use the preserved 900x1400 Blob.
 assert(!(live.r>220&&live.g<35&&live.b<35),'runtime displayed low-res thumbnail instead of original');
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(dir+'\\v10-portrait-landscape-front-mobile.png',Buffer.from(shot.data,'base64'));
 fs.writeFileSync(dir+'\\v10-quality-results.json',JSON.stringify({seed,result,exceptions,failures},null,2));
 console.log('ERR',JSON.stringify(exceptions),'NETWORK',JSON.stringify(failures));
 assert.equal(exceptions.length,0);assert.equal(failures.length,0);
 ws.close();console.log('V10_QUALITY_QA_PASS');
}
main().catch(e=>{console.error('V10_QUALITY_QA_FAIL',e);process.exitCode=1;});
