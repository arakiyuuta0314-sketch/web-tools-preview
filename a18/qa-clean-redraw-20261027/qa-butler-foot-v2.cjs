const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict');
const qa=__dirname,chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',port=18985;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=cp.spawn('python',['-m','http.server','18917','--bind','127.0.0.1','--directory',path.resolve(qa,'../..')],{stdio:'ignore'});
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
  await send('Page.navigate',{url:'http://127.0.0.1:18917/a18/layout-test/index.html?v=approved-initial-isolated-qa'});
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
  fs.writeFileSync(path.join(qa,'butler-foot-v2-browser-render-546x483.png'),bytes);
  const profile=await evalJS('('+async function(){
    const api=window.__A18_SCENE_STUDY__;
    const el=id=>document.getElementById(id);
    const pause=ms=>new Promise(r=>setTimeout(r,ms));
    const until=async(fn,label)=>{
      for(let j=0;j<120;j++){if(fn())return;await pause(90)}
      throw Error('E_QA_TIMEOUT_'+label);
    };
    await until(()=>api?.ready(),'boot');
    for(let i=0;i<3;i++){await until(()=>!!el('introNext'),'intro_'+i);el('introNext').click();}
    await until(()=>!!el('confirmName'),'profile_form');
    el('a18PlayerName').value='QA館長';
    el('a18MuseumTitle').value='新背景QA';
    el('a18PlayerGender').value='female';
    el('confirmName').click();
    await until(()=>api.state().playerName==='QA館長','profile_saved');
    await until(()=>!!el('skipTour'),'intro_after_profile');
    el('skipTour').click();
    await until(()=>el('overlay').hidden,'intro_closed');
    const before=api.state();
    const moved=api.move('left');
    await until(()=>api.state().pos.x<before.pos.x,'walk');
    return {afterProfile:api.state().playerName,avatar:api.state().avatarGender,
      beforePosition:before.pos,afterPosition:api.state().pos,moved,save:api.storage()};
  }.toString()+')()');
  const collision=await evalJS('('+async function(){
    const api=window.__A18_SCENE_STUDY__,L=window.A18Layout;
    const state=api.state(),anchors=state.interactionAnchors;
    const arts=anchors.filter(a=>a.type==='art'),butlers=anchors.filter(a=>a.type==='butler');
    if(arts.length!==2||butlers.length!==1||arts[0].i!==0||arts[1].i!==1)throw Error('WRONG_ENTRANCE_INTERACTIONS '+JSON.stringify(anchors));
    if(state.frameRects.length!==2)throw Error('THIRD_FRAME_STILL_PRESENT');
    if(state.obstacles.length!==1||L.obstacles(state.fixtures,0).length!==1)throw Error('STALE_PARTITION_OR_FRAME_COLLISION');
    if(JSON.stringify(state.obstacles[0])!==JSON.stringify([129,149,361,368]))throw Error('FOOT_COLLISION_SIZE '+JSON.stringify(state.obstacles[0]));
    if(!document.getElementById('floorMapButton').hidden)throw Error('MAP_TRAVEL_VISIBLE');
    const checks=[
      [80,320,true,'old_left_wall'],[480,320,true,'old_right_wall'],[450,400,true,'old_front_frame'],
      [280,205,false,'solid_rear_wall'],[280,209,false,'solid_rear_wall_edge'],
      [280,220,true,'rear_wall_floor'],[139,343,true,'pass_behind_butler'],[139,360,false,'butler_feet'],
      [139,280,true,'space_before_butler']
    ];
    for(const [x,y,expect,label] of checks){
      const actual=api.canMove(x,y);
      if(actual!==expect)throw Error('COLLISION_'+label+' '+x+','+y+' expected '+expect+' got '+actual);
    }
    // Walk through both old side-exit zones. Never change the room.
    for(let i=0;i<22;i++)api.move('left');
    const west=api.state();
    if(west.pos.x>75||west.galleryIndex!==0||api.checkPortal()!==false)throw Error('WEST_EXIT_STILL_ACTIVE '+JSON.stringify(west.pos));
    for(let i=0;i<37;i++)api.move('right');
    const east=api.state();
    if(east.pos.x<470||east.galleryIndex!==0||api.checkPortal()!==false)throw Error('EAST_EXIT_STILL_ACTIVE '+JSON.stringify(east.pos));
    // Physically approach the RIGHT rear frame, then LEFT rear frame.
    for(let i=0;i<15;i++)api.move('up');
    for(let i=0;i<5;i++)api.move('left');
    const right=api.state();
    if(right.interaction?.type!=='art'||right.interaction.i!==1)throw Error('RIGHT_FRAME_NOT_INTERACTIVE '+JSON.stringify(right.interaction));
    for(let i=0;i<26;i++)api.move('left');
    const left=api.state();
    if(left.interaction?.type!=='art'||left.interaction.i!==0)throw Error('LEFT_FRAME_NOT_INTERACTIVE '+JSON.stringify(left.interaction));
    return {anchors,obstacles:state.obstacles,wallFoot:state.wallFootLine,
      west:{x:west.pos.x,y:west.pos.y,room:west.galleryIndex},
      east:{x:east.pos.x,y:east.pos.y,room:east.galleryIndex},
      right: right.interaction,left:left.interaction,
      finalPosition:left.pos,probes:checks.map(q=>q[3])};
  }.toString()+')()');
  const rearWalk=await evalJS('('+function(){
    const api=window.__A18_SCENE_STUDY__;
    const original=api.state().pos;
    for(let i=0;i<7;i++)api.move('down');
    const beforeCross=api.state().pos;
    if(beforeCross.y!==original.y+84)throw Error('UNABLE_TO_APPROACH_BEHIND '+JSON.stringify({original,beforeCross}));
    for(let i=0;i<2;i++)api.move('right');
    const crossing=api.state().pos;
    if(crossing.y!==beforeCross.y || crossing.x!==beforeCross.x+24)throw Error('CANNOT_PASS_BEHIND_BUTLER '+JSON.stringify(crossing));
    const butler=window.A18Layout.BUTLER;
    if(!(crossing.x>butler.x-6&&crossing.x<butler.x+9&&crossing.y<butler.footY))throw Error('NOT_BEHIND_BUTLER '+JSON.stringify(crossing));
    return {original,beforeCross,crossing,room:api.state().galleryIndex};
  }.toString()+')()');
  await sleep(160);
  const behindScreenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(qa,'butler-foot-v2-behind-butler-390x844.png'),Buffer.from(behindScreenshot.data,'base64'));
  await sleep(1000);
  await send('Page.reload',{ignoreCache:true});
  let restored=false;
  for(let i=0;i<90;i++){await sleep(100);try{restored=await evalJS('!!window.__A18_SCENE_STUDY__?.ready() && window.__A18_SCENE_STUDY__?.state().playerName==="QA館長"');}catch{}if(restored)break;}
  assert(restored,'SAVE_RELOAD_DID_NOT_RESTORE');
  const persisted=await evalJS('({name:window.__A18_SCENE_STUDY__.state().playerName,pos:window.__A18_SCENE_STUDY__.state().pos,scene:window.__A18_SCENE_STUDY__.state().scene,storage:window.__A18_SCENE_STUDY__.storage()})');
  assert.equal(persisted.pos.x,rearWalk.crossing.x,'walking position must be saved');
  assert.equal(persisted.scene,'entrance');
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:true,screenOrientation:{type:'landscapePrimary',angle:90}});
  await sleep(350);
  const landscape=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(qa,'butler-foot-v2-landscape-844x390.png'),Buffer.from(landscape.data,'base64'));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}});
  await sleep(350);

  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(qa,'butler-foot-v2-portrait-390x844.png'),Buffer.from(shot.data,'base64'));
  assert.deepEqual([result.background.width,result.background.height],[1322,1190]);
  assert.equal(result.assetCount,5,'new approved base + 3 legacy masks + atlas');
  assert.equal(result.geometry.outer.x,421);
  assert.equal(result.geometry.outer.y,195);
  assert(bytes.length>150000);
  assert.equal(errors.length,0,'browser JS exceptions '+JSON.stringify(errors));
  assert.equal(fails.length,0,'network failed '+JSON.stringify(fails));
  const report={status:'PASS',result,profile,collision,rearWalk,persisted,jsExceptions:errors,networkErrors:fails,server:'local loopback isolated Chrome'};
  fs.writeFileSync(path.join(qa,'butler-foot-v2-results.json'),JSON.stringify(report,null,2));
  console.log('BUTLER_FOOT_BROWSER_QA_PASS',JSON.stringify(result), 'renderPNG',bytes.length,'bytes');
  ws.close();
 }finally{ch.kill();server.kill();await sleep(400);}
}
run().catch(e=>{console.error('BUTLER_FOOT_BROWSER_QA_FAILED',e);process.exitCode=1;});
