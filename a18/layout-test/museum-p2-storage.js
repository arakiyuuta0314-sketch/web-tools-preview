/* A18 P2 isolated schema-v3 store. Never reads, upgrades or deletes schema-v2. */
(()=>{'use strict';
const L=window.A18Layout;
const DATABASE='a18-museum-p2-isolated-v3', STORE='states', KEY='museum', EVENTS=['intro-v1','lv2-v1','lv3-v1','lv4-v1','lv5-v1','lv6-v1','gallery06-complete-v1'];
const error=(code,path='')=>Object.assign(Error(code+(path?' '+path:'')),{code,path});
const copy=x=>structuredClone(x);
let dbPromise=null, fault=null;
const testMode=location.hostname==='127.0.0.1'&&new URLSearchParams(location.search).has('p2-e2e');
function openDb(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open(DATABASE,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>reject(error('E_DB_OPEN'));
  req.onblocked=()=>reject(error('E_DB_BLOCKED'));
  req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result)};
 });
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
function initial(){
 return {schemaVersion:3,revision:0,fixtures:L.defaults(),works:[],avatarGender:'male',playerName:'',
 museumTitle:'とっておき美術館',galleryIndex:0,pos:{x:326,y:425,dir:'up',stride:0},
 carrying:null,progression:{unlockedThroughLevel:1,awardedRoomIds:[],events:[],newRoomNotices:[],migration:null}};
}
function validate(s){
 if(!s||s.schemaVersion!==3)throw error('E_SCHEMA_UNKNOWN','schemaVersion');
 if(!Number.isSafeInteger(s.revision)||s.revision<0)throw error('E_REVISION');
 const p=s.progression;
 if(!p||!Number.isInteger(p.unlockedThroughLevel)||p.unlockedThroughLevel<1||p.unlockedThroughLevel>6)throw error('E_PROGRESSION_INVARIANT','level');
 if(p.migration!==null)throw error('E_MIGRATION_NOT_APPROVED');
 if(!Array.isArray(p.awardedRoomIds)||new Set(p.awardedRoomIds).size!==p.awardedRoomIds.length
  ||p.awardedRoomIds.some(r=>!Number.isInteger(r)||r<0||r>5||r>=p.unlockedThroughLevel))throw error('E_PROGRESSION_INVARIANT','awardedRoomIds');
 for(let r=0;r<p.unlockedThroughLevel-1;r++)if(!p.awardedRoomIds.includes(r))throw error('E_PROGRESSION_INVARIANT','award-missing');
 if(!Array.isArray(p.events)||new Set(p.events.map(e=>e.id)).size!==p.events.length
  ||p.events.some(e=>!EVENTS.includes(e.id)||!['queued','available','seen'].includes(e.status)||!['play','migration'].includes(e.origin)))throw error('E_EVENT_DUPLICATE');
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
 for(const w of s.works)if(!(w.originalBlob instanceof Blob))throw error('E_BLOB_MISSING',w.id);
 if(s.carrying!=null){
  const held=s.works.find(w=>w.id===s.carrying);
  if(!held||held.fixtureId!=null)throw error('E_CARRY_CONFLICT');
 }
 if(!Number.isInteger(s.galleryIndex)||s.galleryIndex<0||s.galleryIndex>=p.unlockedThroughLevel)throw error('E_ROOM_LOCKED','galleryIndex');
 const m=L.ROOM_SIZE[s.galleryIndex];
 if(!s.pos||!Number.isFinite(s.pos.x)||!Number.isFinite(s.pos.y)||s.pos.x<0||s.pos.x>m.w||s.pos.y<0||s.pos.y>m.h
 ||!['up','down','left','right'].includes(s.pos.dir)||!Number.isInteger(s.pos.stride))throw error('E_POSITION');
 if(!['male','female'].includes(s.avatarGender)||typeof s.playerName!=='string'||typeof s.museumTitle!=='string')throw error('E_PROFILE');
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
 // P2 only: Lv2 -> Lv3 is intentionally outside scope.
 if(room===0&&!before.progression.awardedRoomIds.includes(0)
   &&!isRoomComplete(0,before.fixtures,before.works)&&isRoomComplete(0,next.fixtures,next.works)){
  next.progression.unlockedThroughLevel=2;
  next.progression.awardedRoomIds.push(0);
  next.progression.newRoomNotices.push(1);
  next.progression.events.push({id:'lv2-v1',origin:'play',status:'queued'});
  transition={completedRoomId:0,openedRoomId:1,eventId:'lv2-v1',kind:'level'};
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
  const tx=database.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(KEY);
  let result=null;
  req.onsuccess=()=>{result=req.result??null;if(result)try{validate(result)}catch(e){reject(e)}};
  tx.oncomplete=()=>resolve(result);
  tx.onabort=()=>reject(tx.error||error('E_TX_ABORT'));
 });
}
async function commit(expected,next){
 validate(next);
 if(next.revision!==(expected===null?0:expected+1))throw error('E_REVISION');
 const database=await openDb();
 const injected=fault;fault=null;
 return new Promise((resolve,reject)=>{
  let finished=false,reason=null;
  const tx=database.transaction(STORE,'readwrite');
  const store=tx.objectStore(STORE);
  const rq=store.get(KEY);
  rq.onsuccess=()=>{
   const live=rq.result??null,revision=live?.revision??null;
   if(revision!==expected){reason=error('E_SAVE_CONFLICT');tx.abort();return}
   if(injected==='abort'){reason=error('E_TX_ABORT');tx.abort();return}
   if(injected==='quota'){reason=error('QuotaExceededError');tx.abort();return}
   store.put(next,KEY);
  };
  rq.onerror=()=>{reason=error('E_READ_ABORT');tx.abort()};
  tx.oncomplete=()=>{if(!finished){finished=true;resolve({committed:true,revision:next.revision})}};
  tx.onabort=()=>{if(!finished){finished=true;reject(reason||tx.error||error('E_TX_ABORT'))}};
  tx.onerror=()=>{};
 });
}
function hydrate(records){return records.map(w=>{if(!(w.originalBlob instanceof Blob))throw error('E_BLOB_MISSING',w.id);
 const originalURL=URL.createObjectURL(w.originalBlob);
 return {...w,originalURL,displaySrc:w.displaySrc||originalURL};
});}
function setFault(kind){if(!testMode)throw error('E_TEST_ONLY');if(!['abort','quota'].includes(kind))throw error('E_FAULT_UNKNOWN');fault=kind}
window.A18P2Store={DATABASE,initial,validate,canTraverse,isRoomComplete,plan,eventAction,load,commit,persisted,hydrate,setFault,testMode,copy};
})();
