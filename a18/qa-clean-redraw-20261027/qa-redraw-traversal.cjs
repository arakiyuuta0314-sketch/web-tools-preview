const assert=require('node:assert/strict'),fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 const targets=await (await fetch('http://127.0.0.1:18942/json')).json();
 const page=targets.find(t=>t.type==='page');
 assert(page);
 const ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
 let seq=0;const pending=new Map(),errors=[],failed=[];
 ws.onmessage=e=>{
  const msg=JSON.parse(e.data.toString());
  if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);
  if(msg.method==='Network.loadingFailed'&&!msg.params.canceled)failed.push(msg.params.errorText);
  if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}
 };
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{
  const reply=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(reply.exceptionDetails)throw Error('BROWSER_EXCEPTION '+JSON.stringify(reply.exceptionDetails).slice(0,500));
  return reply.result.value;
 };
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 const url='http://127.0.0.1:18941/layout-test/index.html?v=nav-regression-20261026';
 const load=async()=>{
  const begin=Date.now();
  await send('Page.navigate',{url});
  let state=null;
  for(let i=0;i<110;i++){
   await sleep(200);
   state=await evaluate("({ready:!!window.__A18_SCENE_STUDY__?.ready(),room:window.__A18_SCENE_STUDY__?.state()?.galleryIndex,asset:window.A18P3Gallery?.assetCount(),p5:window.A18P5Decorations?.assetCount()})");
   if(state.ready)return {elapsedMs:Date.now()-begin,...state};
  }
  throw Error('BOOT_TIMEOUT '+JSON.stringify(state));
 };
 const initial=await load();
 console.log('LOAD_INITIAL',initial);
 assert.equal(initial.room,0);
 assert(initial.asset<12 && initial.p5===0,'eager gallery images still loaded');
 const bfs=await evaluate('('+function(){
  const can=window.__A18_SCENE_STUDY__.canMove;
  const step=6,start=[Math.round(326/step),Math.round(425/step)];
  const key=(x,y)=>x+','+y,seen=new Set([key(...start)]),queue=[start];
  for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const [x,y]=queue[i],nx=x+dx,ny=y+dy,k=key(nx,ny);
   if(!seen.has(k)&&can(nx*step,ny*step)){seen.add(k);queue.push([nx,ny]);}
  }
  const reachable=(x,y)=>{for(let dx=-9;dx<=9;dx+=3)for(let dy=-9;dy<=9;dy+=3)if(seen.has(key(Math.round((x+dx)/step),Math.round((y+dy)/step))))return true;return false;};
  return {nodes:seen.size,west:reachable(70,437),east:reachable(474,437),northLocked:can(284,185)};
 }.toString()+')()');
 console.log('PATH_BFS',bfs);
 assert(bfs.nodes>1000&&bfs.west&&bfs.east&&!bfs.northLocked,'full movement connectivity');

 async function setTestLevel(level,x,y,dir){
  const P2=window.A18P2Store;
  const before=await P2.load(),next=P2.copy(before);
  next.revision=before.revision+1;
  next.galleryIndex=0;next.pos={x,y,dir,stride:0};
  next.playerName='QA';next.avatarGender='male';
  next.progression.unlockedThroughLevel=level;
  next.progression.awardedRoomIds=Array.from({length:level-1},(_,i)=>i);
  next.progression.events=[{id:'intro-v1',origin:'play',status:'seen'}];
  for(let i=0;i<level-1;i++)next.progression.events.push({id:'lv'+(i+2)+'-v1',origin:'play',status:'seen'});
  next.progression.newRoomNotices=[];
  P2.validate(next);await P2.commit(before.revision,next);
  location.reload();return true;
 }
 await evaluate('('+setTestLevel.toString()+')(2,118,437,"left")');
 const lv2=await load();
 assert.equal(lv2.room,0);
 const leftWalk=await evaluate('('+async function(){
  const q=window.__A18_SCENE_STUDY__;
  const steps=[];
  for(let i=0;i<9;i++){
   const state=q.state();steps.push([state.galleryIndex,state.pos.x,state.pos.y]);
   if(state.galleryIndex===1)break;
   q.move('left');await new Promise(r=>setTimeout(r,85));
  }
  for(let i=0;i<50&&q.state().galleryIndex===0;i++)await new Promise(r=>setTimeout(r,160));
  return {steps,room:q.state().galleryIndex,pos:q.state().pos};
 }.toString()+')()');
 console.log('LEFT_ACTUAL_TRAVERSE',leftWalk);
 assert.equal(leftWalk.room,1,'left side actual transition failed');
 const before3=await evaluate('('+async function(){
  const q=window.__A18_SCENE_STUDY__;
  const ok=await q.changeScene(0,{arrivalFrom:'west'});
  return {ok,state:q.state()};
 }.toString()+')()');
 assert(before3.ok&&before3.state.galleryIndex===0,'cannot return to entrance');
 await evaluate('('+setTestLevel.toString()+')(3,435,437,"right")');
 const lv3=await load();
 assert.equal(lv3.room,0);
 const rightWalk=await evaluate('('+async function(){
  const q=window.__A18_SCENE_STUDY__;
  const steps=[];
  for(let i=0;i<9;i++){
   const state=q.state();steps.push([state.galleryIndex,state.pos.x,state.pos.y]);
   if(state.galleryIndex===2)break;
   q.move('right');await new Promise(r=>setTimeout(r,85));
  }
  for(let i=0;i<50&&q.state().galleryIndex===0;i++)await new Promise(r=>setTimeout(r,160));
  return {steps,room:q.state().galleryIndex,pos:q.state().pos};
 }.toString()+')()');
 console.log('RIGHT_ACTUAL_TRAVERSE',rightWalk);
 assert.equal(rightWalk.room,2,'right side actual transition failed');
 assert.equal(errors.length,0,'JS exception '+errors.join(';'));
 assert.equal(failed.length,0,'network error '+failed.join(';'));
 console.log('QA_V09_ACTUAL_MOVEMENT_PASS');
 const output=process.env.TEMP+'\\a18-v11-redraw-qa-20261027\\movement-qa.json';
 fs.writeFileSync(output,JSON.stringify({initial,bfs,lv2,leftWalk,before3:before3.ok,lv3,rightWalk,errors,failed},null,2));
 ws.close();
}
run().catch(e=>{console.error('QA_V09_ACTUAL_MOVEMENT_FAIL',e);process.exitCode=1;});
