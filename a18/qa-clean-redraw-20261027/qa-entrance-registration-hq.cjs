const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict');
const qa=__dirname,chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',port=19174;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=cp.spawn('python',['-m','http.server','19175','--bind','127.0.0.1','--directory',path.resolve(qa,'../..')],{stdio:'ignore'});
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
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await send('Page.navigate',{url:'http://127.0.0.1:19175/a18/layout-test/index.html?v=approved-initial-isolated-qa'});
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
  fs.writeFileSync(path.join(qa,'entrance-registration-hq-background-546x483.png'),bytes);
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
    el('a18PlayerName').value='QA鬯｢・ｨ鬮滂ｽｷ';
    el('a18MuseumTitle').value='隴・ｽｰ髢ｭ譴ｧ蜍ｹQA';
    el('a18PlayerGender').value='female';
    el('confirmName').click();
    await until(()=>api.state().playerName==='QA鬯｢・ｨ鬮滂ｽｷ','profile_saved');
    await until(()=>!!el('skipTour'),'intro_after_profile');
    el('skipTour').click();
    await until(()=>el('overlay').hidden,'intro_closed');
    const before=api.state();
    const moved=api.move('left');
    await until(()=>api.state().pos.x<before.pos.x,'walk');
    return {afterProfile:api.state().playerName,avatar:api.state().avatarGender,
      beforePosition:before.pos,afterPosition:api.state().pos,moved,save:api.storage()};
  }.toString()+')()');
  const artworkSeed=await evalJS('('+async function(){
   // Entirely isolated browser profile; production/user IndexedDB untouched.
   const P=window.A18P2Store,L=window.A18Layout;
   await new Promise(r=>setTimeout(r,850));
   const st=await P.load();if(!st)throw Error('SEED_STATE_NOT_FOUND');
   const mk=async(color)=>{
     const cv=document.createElement('canvas');cv.width=400;cv.height=300;
     const c=cv.getContext('2d');c.fillStyle=color;c.fillRect(0,0,400,300);
     return new Promise(r=>cv.toBlob(r,'image/png'));
   };
   const colors=['#ff35cc','#11eeaa'],blobs=await Promise.all(colors.map(mk));
   st.works=blobs.map((originalBlob,i)=>({
     id:'qa-art-'+i,title:'QA artwork '+i,notes:'',complete:'2026-10-27',
     registered:'2026-10-27',pieces:100,preferredShape:'landscape',
     thumbnail:null,displaySrc:null,fixtureId:'frame-0-'+i,originalBlob
   }));
   L.syncWorks(st.fixtures,st.works);
   const expected=st.revision;st.revision++;
   P.validate(st);await P.commit(expected,st);
   return {revision:st.revision,blobs:blobs.map(b=>b.size)};
  }.toString()+')()');
  await send('Page.reload',{ignoreCache:true});
  let artLoaded=false;
  const artColors=await evalJS('('+async function(){
    const pause=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<140;i++){if(window.__A18_SCENE_STUDY__?.ready()&&window.__A18_SCENE_STUDY__.state().works.length===2)break;await pause(100);}
    const api=window.__A18_SCENE_STUDY__;if(!api?.ready())throw Error('ART_SETUP_BOOT_NOT_READY');
    const c=document.getElementById('world'),cx=c.getContext('2d');
    const sample=()=>{
     const v=api.state().viewport,sc=c.width/v.logicalW,px=v.cameraX,py=v.cameraY;
     return [[116,105],[440,105]].map(([x,y])=>{
      const a=cx.getImageData(Math.round(x*sc-px*sc),Math.round(y*sc-py*sc),1,1).data;
      return [a[0],a[1],a[2],a[3]];
     });
    };
    const expected=rgb=>rgb[0]>205&&rgb[1]<100&&rgb[2]>120;
    const expected2=rgb=>rgb[0]<60&&rgb[1]>190&&rgb[2]>120;
    let initial;
    for(let i=0;i<120;i++){
      initial=sample();if(expected(initial[0])&&expected2(initial[1]))break;
      await pause(100);
    }
    if(!expected(initial[0])||!expected2(initial[1]))
      throw Error('PHOTOS_FAILED_TO_DISPLAY '+JSON.stringify(initial));
    let newUrls=0,revokes=0;
    const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
    URL.createObjectURL=function(...args){newUrls++;return oldCreate.apply(this,args)};
    URL.revokeObjectURL=function(...args){revokes++;return oldRevoke.apply(this,args)};
    const startRev=await window.A18P2Store.load();
    for(let n=0;n<3;n++){
      api.move(n%2?'right':'left');
      await pause(1150);
      const colors=sample();
      if(!expected(colors[0])||!expected2(colors[1]))
       throw Error('PHOTOS_DISAPPEARED_AFTER_WALK_'+n+' '+JSON.stringify(colors));
    }
    const endRev=await window.A18P2Store.load();
    if(endRev.revision<startRev.revision+3)throw Error('WALK_SAVE_DID_NOT_OCCUR '+startRev.revision+' '+endRev.revision);
    if(newUrls!==0||revokes!==0)throw Error('WALK_CAUSED_PHOTO_URL_CHURN create='+newUrls+' revoke='+revokes);
    return {initial,final:sample(),newUrls,revokes,saveRevisions:[startRev.revision,endRev.revision],viewport:api.state().viewport};
  }.toString()+')()');
  const registration=await evalJS('('+async function(){
    const api=window.__A18_SCENE_STUDY__;
    const e=id=>document.getElementById(id),pause=ms=>new Promise(r=>setTimeout(r,ms));
    const until=async(test,label)=>{
      for(let i=0;i<130;i++){if(test())return;await pause(100)}
      throw Error('REGISTRATION_TIMEOUT_'+label);
    };
    const colors=()=>{
      const c=e('world'),ctx=c.getContext('2d'),v=api.state().viewport,sc=c.width/v.logicalW;
      return [[116,105],[440,105]].map(([x,y])=>{
        const p=ctx.getImageData(Math.round((x-v.cameraX)*sc),Math.round((y-v.cameraY)*sc),1,1).data;
        return [...p];
      });
    };
    let created=0,revoked=0;
    const create=URL.createObjectURL,revoke=URL.revokeObjectURL;
    URL.createObjectURL=function(...a){created++;return create.apply(this,a)};
    URL.revokeObjectURL=function(...a){revoked++;return revoke.apply(this,a)};
    const cv=document.createElement('canvas');cv.width=800;cv.height=600;
    const ctx=cv.getContext('2d');ctx.fillStyle='#ffc800';ctx.fillRect(0,0,800,600);
    const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
    api.form(0,true,'butler');
    await until(()=>!!e('photo')&&!!e('name'),'form');
    e('name').value='Third new artwork';
    const dt=new DataTransfer();dt.items.add(new File([blob],'third.png',{type:'image/png'}));
    e('photo').files=dt.files;e('save').click();
    await until(()=>!!e('offerYes'),'offer');
    e('offerYes').click();
    await until(()=>!!e('acceptFinish')&&!!e('previewAfter')?.src,'finish');
    e('acceptFinish').click();
    await until(()=>!!e('receiveWork'),'registration_commit');
    e('receiveWork').click();
    await until(()=>api.state().works.length===3&&!!api.state().carrying,'carrying');
    await pause(300);
    let present=colors();
    const originalColors=()=>{
      const l=present[0],r=present[1];
      return l[0]>205&&l[1]<100&&l[2]>120&&r[0]<60&&r[1]>190&&r[2]>120;
    };
    if(!originalColors())throw Error('EXISTING_IMAGES_DISAPPEARED_ON_REGISTRATION '+JSON.stringify(present));
    if(created!==2||revoked!==1)
      throw Error('REGISTRATION_RECREATED_EXISTING_BLOBS '+created+'/'+revoked);
    const beforeSwap=api.state(),third=beforeSwap.carrying;
    api.inspect(1); // place third into the right frame, move previous right artwork to hands
    await until(()=>api.state().works.some(w=>w.id===third&&w.fixtureId==='frame-0-1'),'swap_persist');
    let right=null;
    for(let i=0;i<100;i++){
      const v=colors(),p=v[1];right=p;
      if(p[0]>190&&p[1]>135&&p[2]<80)break;
      await pause(90);
    }
    if(!(right[0]>190&&right[1]>135&&right[2]<80))
      throw Error('ENHANCED_NEW_ART_NOT_VISIBLE_AFTER_SWAP '+JSON.stringify(right));
    if(created!==2||revoked!==1)
      throw Error('SWAP_INVALIDATED_EXISTING_BLOBS '+created+'/'+revoked);
    const ended=await window.A18P2Store.load();
    return {created,revoked,preExisting:present,newImage:right,works:ended.works.length,
      carrying:api.state().carrying,third,fixtureRight:ended.works.find(w=>w.fixtureId==='frame-0-1')?.id,
      preparedSourceIsJpeg:ended.works.find(w=>w.id===third)?.displaySrc?.startsWith('data:image/jpeg')};
  }.toString()+')()');
  console.log('THIRD_IMAGE_REGISTRATION_PASS',JSON.stringify(registration));
  const registrationScreen=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(qa,'entrance-registration-hq-after-new-registration-390x844.png'),Buffer.from(registrationScreen.data,'base64'));
  const artScreen=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(qa,'entrance-registration-hq-after-moves-390x844.png'),Buffer.from(artScreen.data,'base64'));
  await send('Page.reload',{ignoreCache:true});
  const reloadedArt=await evalJS('('+async function(){
    const pause=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<120;i++){if(window.__A18_SCENE_STUDY__?.ready()&&window.__A18_SCENE_STUDY__.state().works.length===2)break;await pause(100);}
    const api=window.__A18_SCENE_STUDY__;if(!api||api.state().works.length!==3)throw Error('PHOTO_SAVE_LOST');
    const c=document.getElementById('world'),ctx=c.getContext('2d');
    let observed=null;
    for(let i=0;i<120;i++){
      const v=api.state().viewport,sc=c.width/v.logicalW;
      observed=[[116,105],[440,105]].map(([x,y])=>{
        const data=ctx.getImageData(Math.round((x-v.cameraX)*sc),Math.round((y-v.cameraY)*sc),1,1).data;
        return [data[0],data[1],data[2],data[3]];
      });
      if(observed[0][0]>205&&observed[0][1]<100&&observed[0][2]>120&&
         observed[1][0]>190&&observed[1][1]>135&&observed[1][2]<80)break;
      await pause(100);
    }
    if(!(observed[0][0]>205&&observed[0][1]<100&&observed[0][2]>120&&
         observed[1][0]>190&&observed[1][1]>135&&observed[1][2]<80))
      throw Error('PHOTO_PIXELS_MISSING_AFTER_RELOAD '+JSON.stringify(observed));
    return {count:api.state().works.length,revision:(await window.A18P2Store.load()).revision,colors:observed};
  }.toString()+')()');
  console.log('TWO_ART_WORKFLOW_PASS',JSON.stringify({artworkSeed,artColors,reloadedArt}));
  const geometryAtRest=await evalJS('('+async function(){
    const pause=ms=>new Promise(r=>setTimeout(r,ms));
    await pause(650);
    const c=document.querySelector('canvas#world'),stage=document.getElementById('stage'),app=document.querySelector('.app'),p=window.__A18_SCENE_STUDY__;
    const rect=o=>{const r=o.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
    const samples=[];
    for(let k=0;k<12;k++){
      const st=p.state();
      samples.push({at:performance.now(),cameraX:st.viewport.cameraX,cameraY:st.viewport.cameraY,
        canvasLength:c.toDataURL('image/png').length,paintCount:st.viewport.entrancePaintCount,player:st.pos});
      await pause(80);
    }
    return {client:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visualViewport:{width:visualViewport.width,height:visualViewport.height}},display:{stage:rect(stage),canvas:rect(c),app:rect(app)},backing:[c.width,c.height],viewport:p.state().viewport,
      imageOriginal:[1322,1190],sourceGame:[546,483],samples};
  }.toString()+')()');
  fs.writeFileSync(path.join(qa,'entrance-registration-hq-metrics.json'),JSON.stringify(geometryAtRest,null,2));
  const h=geometryAtRest;
  assert(Math.abs(h.viewport.logicalW-445)<0.01,'pre-zoom framing not restored '+h.viewport.logicalW);
  assert(Math.abs(h.viewport.logicalH-(h.display.canvas.h*445/h.display.canvas.w))<.01,'portrait aspect mapping wrong '+h.viewport.logicalH);
  assert(Math.abs(h.display.canvas.h-(h.display.stage.h-164))<1.5,'canvas should fill portrait play area');
  assert(h.samples.every(s=>s.canvasLength===h.samples[0].canvasLength),'unstable stationary canvas frame length');
  assert(h.samples.every(s=>s.paintCount===h.samples[0].paintCount),'idle redraw must be suppressed on iPhone: '+JSON.stringify(h.samples.map(s=>s.paintCount)));
  const stableResize=await evalJS('('+function(){
    const c=document.getElementById('world'),api=window.__A18_SCENE_STUDY__;
    const before=c.toDataURL(),width=c.width,height=c.height;
    for(let i=0;i<6;i++)window.dispatchEvent(new Event('resize'));
    return {samePixels:before===c.toDataURL(),sameSize:c.width===width&&c.height===height,
      viewport:api.state().viewport};
  }.toString()+')()');
  assert(stableResize.samePixels,'repeated Safari resize cleared canvas despite stable dimensions');
  assert(stableResize.sameSize,'repeated stable resize changed backing size');
  console.log('DISPLAY_QA_STABILITY',JSON.stringify({viewport:h.viewport,stableResize}));

  console.log('QUALITY_BEFORE',JSON.stringify(geometryAtRest));
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
  fs.writeFileSync(path.join(qa,'entrance-registration-hq-behind-390x844.png'),Buffer.from(behindScreenshot.data,'base64'));
  await sleep(1000);
  await send('Page.reload',{ignoreCache:true});
  let restored=false;
  for(let i=0;i<90;i++){await sleep(100);try{restored=await evalJS('!!window.__A18_SCENE_STUDY__?.ready() && window.__A18_SCENE_STUDY__?.state().playerName==="QA鬯｢・ｨ鬮滂ｽｷ"');}catch{}if(restored)break;}
  assert(restored,'SAVE_RELOAD_DID_NOT_RESTORE');
  const persisted=await evalJS('({name:window.__A18_SCENE_STUDY__.state().playerName,pos:window.__A18_SCENE_STUDY__.state().pos,scene:window.__A18_SCENE_STUDY__.state().scene,storage:window.__A18_SCENE_STUDY__.storage()})');
  assert.equal(persisted.pos.x,rearWalk.crossing.x,'walking position must be saved');
  assert.equal(persisted.scene,'entrance');
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:3,mobile:true,screenOrientation:{type:'landscapePrimary',angle:90}});
  await sleep(350);
  const landscape=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(qa,'entrance-registration-hq-landscape-844x390.png'),Buffer.from(landscape.data,'base64'));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}});
  await sleep(350);

  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(qa,'entrance-registration-hq-portrait-390x844.png'),Buffer.from(shot.data,'base64'));
  assert.deepEqual([result.background.width,result.background.height],[1322,1190]);
  assert.equal(result.assetCount,5,'new approved base + 3 legacy masks + atlas');
  assert.equal(result.geometry.outer.x,421);
  assert.equal(result.geometry.outer.y,195);
  assert(bytes.length>150000);
  assert.equal(errors.length,0,'browser JS exceptions '+JSON.stringify(errors));
  assert.equal(fails.length,0,'network failed '+JSON.stringify(fails));
  const report={status:'PASS',result,profile,artworkSeed,artColors,registration,reloadedArt,collision,rearWalk,persisted,display:geometryAtRest,stableResize,jsExceptions:errors,networkErrors:fails,server:'local loopback isolated Chrome'};
  fs.writeFileSync(path.join(qa,'entrance-registration-hq-gameplay-results.json'),JSON.stringify(report,null,2));
  console.log('ENTRANCE_REGISTRATION_HQ_QA_PASS',JSON.stringify(result), 'renderPNG',bytes.length,'bytes');
  ws.close();
 }finally{ch.kill();server.kill();await sleep(400);}
}
run().catch(e=>{console.error('ENTRANCE_REGISTRATION_HQ_QA_FAILED',e);process.exitCode=1;});
