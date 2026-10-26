/* A18 release v3: one atomic state record; no legacy migration, reset or fault injection. */
(()=>{'use strict';
const L=window.A18Layout;
const DATABASE='a18-totteoki-museum-v3', STORE='states', KEY='museum', EVENTS=['intro-v1','lv2-v1','lv3-v1','lv4-v1','lv5-v1','lv6-v1','gallery06-complete-v1'];
const error=(code,path='')=>Object.assign(Error(code+(path?' '+path:'')),{code,path});
const copy=x=>structuredClone(x);
let dbPromise=null;
function openDb(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  let req,settled=false;
  const fail=(code)=>{if(!settled){settled=true;reject(error(code))}};
  try{req=indexedDB.open(DATABASE,1)}catch(e){fail(e.name==='VersionError'?'E_DB_VERSION':'E_DB_OPEN');return}
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
  };
  req.onerror=()=>fail(req.error?.name==='VersionError'?'E_DB_VERSION':'E_DB_OPEN');
  req.onblocked=()=>fail('E_DB_BLOCKED');
  req.onsuccess=()=>{
   const db=req.result;
   if(settled){db.close();return}
   const names=Array.from(db.objectStoreNames);
   if(names.length!==1||names[0]!==STORE||db.transaction(STORE,'readonly').objectStore(STORE).keyPath!==null){
    db.close();fail('E_SCHEMA_UNKNOWN');return;
   }
   db.onversionchange=()=>{db.close();dbPromise=null};
   settled=true;resolve(db);
  };
 }).catch(e=>{dbPromise=null;throw e});
 return dbPromise;
}
function cleanWork(w){
 const value={...w};
 delete value.originalURL;delete value.image;delete value.source;
 if(w.displaySrc===w.originalURL)value.displaySrc=null;
 return value;
}
function persisted(runtime){
 return {...runtime,fixtures:copy(runtime.fixtures),works:runtime.works.map(cleanWork),pos:{...runtime.pos},
  progression:copy(runtime.progression)};
}
function makeInitialV3(){
 return {schemaVersion:3,revision:0,fixtures:L.defaults(),works:[],avatarGender:'male',playerName:'',
 museumTitle:'とっておき美術館',galleryIndex:0,pos:{x:326,y:425,dir:'up',stride:0},
 carrying:null,progression:{unlockedThroughLevel:1,awardedRoomIds:[],events:[{id:'intro-v1',origin:'play',status:'queued'}],newRoomNotices:[],migration:null}};
}
function validate(s){
 if(!s||typeof s!=='object'||s.schemaVersion!==3)throw error('E_SCHEMA_UNKNOWN','schemaVersion');
 if(!Number.isSafeInteger(s.revision)||s.revision<0)throw error('E_REVISION');
 const p=s.progression;
 if(!p||!Number.isInteger(p.unlockedThroughLevel)||p.unlockedThroughLevel<1||p.unlockedThroughLevel>6)throw error('E_PROGRESSION_INVARIANT','level');
 if(p.migration!==null)throw error('E_MIGRATION_NOT_APPROVED');
 if(!Array.isArray(p.awardedRoomIds)||new Set(p.awardedRoomIds).size!==p.awardedRoomIds.length
  ||p.awardedRoomIds.some(r=>!Number.isInteger(r)||r<0||r>5||r>=p.unlockedThroughLevel))throw error('E_PROGRESSION_INVARIANT','awardedRoomIds');
 for(let r=0;r<p.unlockedThroughLevel-1;r++)if(!p.awardedRoomIds.includes(r))throw error('E_PROGRESSION_INVARIANT','award-missing');
 if(!Array.isArray(p.events)||!p.events.some(e=>e?.id==='intro-v1')
  ||new Set(p.events.map(e=>e?.id)).size!==p.events.length
  ||p.events.some(e=>!e||!EVENTS.includes(e.id)||!['queued','available','seen'].includes(e.status)||e.origin!=='play'))
  throw error('E_EVENT_DUPLICATE');
 for(let r=0;r<6;r++){
  const award=p.awardedRoomIds.includes(r);
  const id=r===5?'gallery06-complete-v1':'lv'+(r+2)+'-v1';
  if(award!==p.events.some(e=>e.id===id))throw error('E_PROGRESSION_INVARIANT','event-award-'+r);
 }
 if(!Array.isArray(p.newRoomNotices)||new Set(p.newRoomNotices).size!==p.newRoomNotices.length
  ||p.newRoomNotices.some(r=>!Number.isInteger(r)||r<1||r>=p.unlockedThroughLevel))throw error('E_PROGRESSION_INVARIANT','notices');
 if(!Array.isArray(s.fixtures)||!Array.isArray(s.works))throw error('E_WORK_LINK');
 const frames=s.fixtures.filter(f=>f.kind==='frame');
 const base=L.defaults();
 if(frames.length!==28||new Set(frames.map(f=>f.id)).size!==28)throw error('E_FRAME_DUPLICATE');
 for(const x of base){
  const f=frames.find(f=>f.id===x.id);
  if(!f||f.roomId!==x.roomId||f.legacySlot!==x.legacySlot)throw error('E_FRAME_DUPLICATE',x.id);
 }
 try{L.assertData(s.fixtures,s.works)}catch(e){throw error('E_WORK_LINK',e.message)}
 for(const w of s.works){
  if(!(w.originalBlob instanceof Blob)||w.originalBlob.size===0)throw error('E_BLOB_MISSING',w.id);
  if(typeof w.id!=='string'||!w.id.trim()||typeof w.title!=='string'||!w.title.trim()
   ||typeof w.notes!=='string'||(w.complete!==null&&typeof w.complete!=='string')||typeof w.registered!=='string'
   ||(w.pieces!==null&&!(Number.isFinite(w.pieces)&&w.pieces>0))
   ||!['landscape','portrait','square'].includes(w.preferredShape)
   ||(w.thumbnail!=null&&typeof w.thumbnail!=='string')
   ||(w.displaySrc!=null&&typeof w.displaySrc!=='string')
   ||(w.fixtureId!=null&&typeof w.fixtureId!=='string')
   ||Object.hasOwn(w,'originalURL')||Object.hasOwn(w,'image')||Object.hasOwn(w,'source'))
    throw error('E_WORK_LINK','work-fields-'+w.id);
  // Optional recipe is backward-compatible with existing v3 saved works.
  if(w.editRecipe!=null){
   const r=w.editRecipe,c=r?.crop,p=r?.toneProfile;
   const natural=n=>Number.isSafeInteger(n)&&n>0;
   const offset=n=>Number.isSafeInteger(n)&&n>=0;
   if(!r||r.version!==1||!natural(r.sourceWidth)||!natural(r.sourceHeight)||
    !c||!offset(c.x)||!offset(c.y)||!natural(c.w)||!natural(c.h)||
    c.x+c.w>r.sourceWidth||c.y+c.h>r.sourceHeight||
    typeof r.cropEnabled!=='boolean'||typeof r.toneEnabled!=='boolean'||
    typeof r.sharpEnabled!=='boolean'||!p||!Array.isArray(p.whiteBalance)||
    p.whiteBalance.length!==3||
    ![...p.whiteBalance,p.gamma,p.shadows,p.highlights,p.contrast,p.saturation,p.sharpness].every(Number.isFinite))
    throw error('E_WORK_RECIPE_INVALID',w.id);
   if(r.perspectiveEnabled!==undefined && typeof r.perspectiveEnabled!=='boolean')
    throw error('E_WORK_RECIPE_PERSPECTIVE',w.id);
   if(r.perspectiveEnabled&&!Array.isArray(r.quad))
    throw error('E_WORK_RECIPE_PERSPECTIVE',w.id);
   if(r.quad!==undefined){
    const points=r.quad;
    if(!Array.isArray(points)||points.length!==4||
     points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||
      p.x<0||p.x>r.sourceWidth-1||p.y<0||p.y>r.sourceHeight-1))
     throw error('E_WORK_RECIPE_PERSPECTIVE',w.id);
    const area=points.reduce((sum,p,i)=>{
     const n=points[(i+1)%4];return sum+p.x*n.y-n.x*p.y;
    },0);
    const cross=points.map((p,i)=>{
     const b=points[(i+1)%4],c=points[(i+2)%4];
     return (b.x-p.x)*(c.y-b.y)-(b.y-p.y)*(c.x-b.x);
    });
    if(area<r.sourceWidth*r.sourceHeight*.003 ||
       cross.some(v=>v<=r.sourceWidth*r.sourceHeight*.0002))
     throw error('E_WORK_RECIPE_PERSPECTIVE',w.id);
   }
   if(r.perspectiveEnabled&&r.cropEnabled)
    throw error('E_WORK_RECIPE_PERSPECTIVE',w.id);
  }
 }
 if(s.carrying!=null){
  const held=s.works.find(w=>w.id===s.carrying);
  if(!held||held.fixtureId!=null)throw error('E_CARRY_CONFLICT');
 }
 if(!Number.isInteger(s.galleryIndex)||s.galleryIndex<0||s.galleryIndex>=p.unlockedThroughLevel)throw error('E_ROOM_LOCKED','galleryIndex');
 const m=L.ROOM_SIZE[s.galleryIndex];
 if(!s.pos||!Number.isFinite(s.pos.x)||!Number.isFinite(s.pos.y)||s.pos.x<0||s.pos.x>m.w||s.pos.y<0||s.pos.y>m.h
 ||!['up','down','left','right'].includes(s.pos.dir)||!Number.isInteger(s.pos.stride)||s.pos.stride<0||s.pos.stride>4)throw error('E_POSITION');
 if(!['male','female'].includes(s.avatarGender)||typeof s.playerName!=='string'||s.playerName.length>24||typeof s.museumTitle!=='string'||!s.museumTitle.trim()||s.museumTitle.length>24)throw error('E_PROFILE');
 return {ok:true,revision:s.revision,workCount:s.works.length,frameCount:28,openedRoomIds:Array.from({length:p.unlockedThroughLevel},(_,i)=>i)};
}
function canTraverse(from,dir,p){
 if(!Number.isInteger(from)||from<0||from>5||!['west','east','north','south'].includes(dir))throw error('E_DIRECTION');
 const lv=p?.unlockedThroughLevel;
 if(!Number.isInteger(lv)||lv<1||lv>6)throw error('E_PROGRESSION_INVARIANT');
 const target=L.ROOM_LINKS[from][dir];
 return target!==undefined&&from<lv&&target<lv;
}
function isRoomComplete(room,fixtures,works){
 if(!Number.isInteger(room)||room<0||room>5)throw error('E_ROOM_ID');
 const required=L.defaults().filter(f=>f.kind==='frame'&&f.roomId===room);
 for(const f of required){
  const actual=fixtures.filter(v=>v.id===f.id);
  if(actual.length!==1||actual[0].kind!=='frame')throw error('E_FRAME_DUPLICATE',f.id);
  const w=works.filter(v=>v.fixtureId===f.id);
  if(w.length>1||w.length===1&&actual[0].workId!==w[0].id||w.length===0&&actual[0].workId!=null)throw error('E_WORK_LINK',f.id);
  if(w.length===0)return false;
 }
 return true;
}
function plan(before, candidate){
 validate(before);validate(candidate);
 if(candidate.revision!==before.revision||JSON.stringify(candidate.progression)!==JSON.stringify(before.progression))throw error('E_UNAUTHORIZED_PROGRESS');
 const next=copy(candidate),room=before.progression.unlockedThroughLevel-1;
 let transition=null;
 // Progress only on first completion of the current frontier, up to six rooms.
 if(!before.progression.awardedRoomIds.includes(room)
   &&!isRoomComplete(room,before.fixtures,before.works)
   &&isRoomComplete(room,next.fixtures,next.works)){
  const isFinal=room===5,openedRoomId=isFinal?null:room+1;
  const eventId=isFinal?'gallery06-complete-v1':'lv'+(room+2)+'-v1';
  if(next.progression.events.some(e=>e.id===eventId))throw error('E_EVENT_DUPLICATE');
  next.progression.awardedRoomIds.push(room);
  if(!isFinal){
   next.progression.unlockedThroughLevel=room+2;
   next.progression.newRoomNotices.push(openedRoomId);
  }
  next.progression.events.push({id:eventId,origin:'play',status:'queued'});
  transition={completedRoomId:room,openedRoomId,eventId,kind:isFinal?'final':'level'};
 }
 next.revision=before.revision+1;
 validate(next);
 return {nextSave:next,expectedRevision:before.revision,nextRevision:next.revision,transition};
}
function eventAction(before,id,action){
 validate(before);
 const next=copy(before),ev=next.progression.events.find(e=>e.id===id);
 if(!ev)throw error('E_EVENT_UNKNOWN');
 if(action==='finish'&&['queued','available'].includes(ev.status))ev.status='seen';
 else if(action==='skip'&&ev.status==='queued')ev.status='available';
 else if(action==='replay'&&ev.status==='seen'){}
 else throw error('E_EVENT_ACTION');
 next.revision++;
 validate(next);
 return next;
}
async function load(){
 const database=await openDb();
 return new Promise((resolve,reject)=>{
  let tx,req,keyReq,result=null,reason=null,done=false,valueReady=false,keyReady=false;
  const fail=e=>{if(!done){done=true;reject(e)}};
  const completeRead=()=>{
   if(!valueReady||!keyReady)return;
   const exists=keyReq.result!==undefined;
   if(!exists&&req.result===undefined){result=null;return}
   try{
    // get() alone cannot distinguish a missing key from a stored null.
    // Only a physically absent key represents a new museum.
    if(!exists)throw error('E_SCHEMA_UNKNOWN','key-value-invariant');
    result=req.result;
    validate(result);
   }catch(e){reason=e;try{tx.abort()}catch(_){}}
  };
  try{
   tx=database.transaction(STORE,'readonly');
   const store=tx.objectStore(STORE);
   req=store.get(KEY);keyReq=store.getKey(KEY);
  }catch(e){fail(error('E_READ_ABORT'));return}
  req.onsuccess=()=>{valueReady=true;completeRead()};
  keyReq.onsuccess=()=>{keyReady=true;completeRead()};
  req.onerror=keyReq.onerror=()=>{reason=error('E_READ_ABORT')};
  tx.oncomplete=()=>{if(!done){done=true;resolve(result)}};
  tx.onabort=()=>fail(reason||error('E_READ_ABORT'));
  tx.onerror=()=>{};
 });
}
async function commit(expected,next){
 // Freeze exactly the candidate that was validated; callers may mutate their draft later.
 const snapshot=copy(next);
 validate(snapshot);
 if(expected!==null&&(!Number.isSafeInteger(expected)||expected<0))throw error('E_REVISION');
 if(snapshot.revision!==(expected===null?0:expected+1))throw error('E_REVISION');
 const database=await openDb();
 return new Promise((resolve,reject)=>{
  let tx,req,keyReq,reason=null,finished=false,valueReady=false,keyReady=false;
  const fail=e=>{if(!finished){finished=true;reject(e)}};
  const attempt=()=>{
   if(!valueReady||!keyReady)return;
   const exists=keyReq.result!==undefined;
   const live=req.result;
   // A physically present null/undefined/invalid record is NOT a fresh start.
   if(exists){
    try{validate(live)}catch(e){reason=error('E_SAVE_LIVE_CORRUPT',e.code||e.message);tx.abort();return}
   }else if(live!==undefined){
    reason=error('E_SAVE_LIVE_CORRUPT','key-value-invariant');tx.abort();return;
   }
   const revision=exists?live.revision:null;
   if(revision!==expected){reason=error('E_SAVE_CONFLICT');tx.abort();return}
   try{tx.objectStore(STORE).put(snapshot,KEY)}
   catch(e){reason=e.name==='QuotaExceededError'?error('QuotaExceededError'):error('E_TX_ABORT');tx.abort()}
  };
  try{
   tx=database.transaction(STORE,'readwrite');
   const store=tx.objectStore(STORE);
   req=store.get(KEY);keyReq=store.getKey(KEY);
  }catch(e){fail(error('E_TX_ABORT'));return}
  req.onsuccess=()=>{valueReady=true;attempt()};
  keyReq.onsuccess=()=>{keyReady=true;attempt()};
  req.onerror=keyReq.onerror=()=>{reason=error('E_READ_ABORT')};
  tx.oncomplete=()=>{if(!finished){finished=true;resolve({committed:true,revision:snapshot.revision})}};
  tx.onabort=()=>fail(reason||(tx.error?.name==='QuotaExceededError'?error('QuotaExceededError'):error('E_TX_ABORT')));
  tx.onerror=()=>{};
 });
}
function resetState(before,mode){
 validate(before);
 if(!['works','all'].includes(mode))throw error('E_RESET_MODE');
 const next=mode==='all'?makeInitialV3():copy(before);
 next.revision=before.revision+1;
 next.works=[];
 next.carrying=null;
 next.fixtures=L.defaults();
 L.syncWorks(next.fixtures,next.works);
 validate(next);
 return next;
}
function hydrate(records){return records.map(w=>{if(!(w.originalBlob instanceof Blob))throw error('E_BLOB_MISSING',w.id);
 const originalURL=URL.createObjectURL(w.originalBlob);
 return {...w,originalURL,displaySrc:w.displaySrc||originalURL};
});}
window.A18P2Store={DATABASE,initial:makeInitialV3,makeInitialV3,validate,canTraverse,isRoomComplete,plan,eventAction,resetState,load,commit,persisted,hydrate,copy};
})();
