'use strict';
(async()=>{
const params=new URLSearchParams(location.search);
const phase=params.get('phase')||'first';
const P=window.A18P2Store,L=window.A18Layout;
const NAME='a18-totteoki-museum-v3', LEGACY='a18-museum-layout-v2',KEY='museum', STORE='states';
const r={phase,cases:[],observations:{},fatal:null};
function check(label,ok,details=null){r.cases.push({name:label,pass:!!ok,details});if(!ok)throw Error('ASSERT '+label+' '+JSON.stringify(details));}
function report(){r.total=r.cases.length;r.passed=r.cases.filter(x=>x.pass).length;r.failed=r.total-r.passed;window.__A18_RESULTS__=r;document.getElementById('output').textContent=JSON.stringify(r,null,2);}
function sleep(ms){return new Promise(ok=>setTimeout(ok,ms));}
function open(name,version=1){return new Promise((res,rej)=>{let q=indexedDB.open(name,version);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE)};q.onerror=()=>rej(q.error);q.onsuccess=()=>res(q.result);q.onblocked=()=>rej(Error('blocked'));});}
async function get(db){return new Promise((res,rej)=>{let t=db.transaction(STORE,'readonly'),q=t.objectStore(STORE).get(KEY),v;t.oncomplete=()=>res(v);t.onabort=()=>rej(t.error);q.onsuccess=()=>v=q.result;});}
async function put(db,s){return new Promise((res,rej)=>{let t=db.transaction(STORE,'readwrite');t.objectStore(STORE).put(s,KEY);t.oncomplete=res;t.onabort=()=>rej(t.error);});}
async function remove(db){return new Promise((res,rej)=>{let t=db.transaction(STORE,'readwrite');t.objectStore(STORE).delete(KEY);t.oncomplete=res;t.onabort=()=>rej(t.error);});}
async function sha(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');}
async function evidence(s){return {schema:s.schemaVersion,revision:s.revision,level:s.progression.unlockedThroughLevel,events:s.progression.events,awards:s.progression.awardedRoomIds,notices:s.progression.newRoomNotices,gender:s.avatarGender,playerName:s.playerName,museumTitle:s.museumTitle,galleryIndex:s.galleryIndex,pos:s.pos,carrying:s.carrying,fixtures:s.fixtures.map(f=>({id:f.id,workId:f.workId,legacySlot:f.legacySlot,design:f.design,x:f.x,y:f.y})),works:await Promise.all(s.works.map(async w=>({id:w.id,title:w.title,notes:w.notes,pieces:w.pieces,complete:w.complete,registered:w.registered,preferredShape:w.preferredShape,fixtureId:w.fixtureId,thumbnail:w.thumbnail,displaySrc:w.displaySrc,extraSourceTag:w.extraSourceTag,blobType:w.originalBlob.type,blobSize:w.originalBlob.size,sha256:await sha(w.originalBlob)})))};}
function sample(id,frame){
 // Real decodable, procedurally generated PNG bytes; synthetic pictures only.
 const c=document.createElement('canvas');c.width=112;c.height=84;
 const ctx=c.getContext('2d'),hue=Array.from(id).reduce((n,ch)=>n+ch.charCodeAt(0),0)%360;
 ctx.fillStyle='hsl('+hue+',45%,60%)';ctx.fillRect(0,0,112,84);
 ctx.fillStyle='rgba(255,255,255,.65)';ctx.fillRect(7,7,98,70);
 ctx.fillStyle='#31473d';ctx.font='10px sans-serif';ctx.fillText('A18 SYNTHETIC',10,26);
 ctx.font='11px sans-serif';ctx.fillText(id,10,50,92);
 const dataURL=c.toDataURL('image/png');
 const bytes=Uint8Array.from(atob(dataURL.split(',')[1]),ch=>ch.charCodeAt(0));
 return {id,title:'合成作品 '+id,notes:'合成メモ／日本語・記号［★］ '+id,
  complete:'2026-10-23',registered:'2026-10-23',pieces:300,preferredShape:'portrait',
  fixtureId:frame,thumbnail:dataURL,displaySrc:dataURL,extraSourceTag:'synthetic-only-'+id,
  originalBlob:new Blob([bytes],{type:'image/png'})};
}
async function oldEvidence(){const db=await open(LEGACY);const v=await get(db);db.close();return {schemaVersion:v?.schemaVersion,playerName:v?.playerName,works:(await Promise.all((v?.works||[]).map(async w=>({id:w.id,sha256:await sha(w.originalBlob)}))))};}
try{
check('approved-release-candidate-db-name',P.DATABASE===NAME,P.DATABASE);
if(phase==='worker'){window.__WORKER_READY__=true;report();return;}
if(phase==='first'){
 // All operations run exclusively in a temporary Chrome user data profile.
 const old=await open(LEGACY);
 const oldSource={schemaVersion:2,playerName:'SYNTHETIC-LEGACY-USER',museumTitle:'legacy-only',works:[{id:'old-photo',originalBlob:new Blob(['legacy blob must stay'],{type:'image/png'})}]};
 await put(old,oldSource);old.close();
 const oldBefore=await oldEvidence();sessionStorage.setItem('legacy',JSON.stringify(oldBefore));
 check('synthetic-v2-seeded',oldBefore.schemaVersion===2);
 check('new-v3-load-is-null-with-old-present',(await P.load())===null);
 check('old-profile-not-imported',!(JSON.stringify(await P.load()).includes('SYNTHETIC-LEGACY-USER')));
 let initial=P.makeInitialV3();
 check('initial-v3-schema-rev',initial.schemaVersion===3&&initial.revision===0);
 check('initial-lv1-only',initial.progression.unlockedThroughLevel===1&&initial.galleryIndex===0&&initial.fixtures.length===28&&initial.works.length===0);
 check('initial-intro-one',initial.progression.events.length===1&&initial.progression.events[0].status==='queued');
 // True simultaneous first-boot CAS, not two sequential creation attempts.
 const initTab=window.open(location.origin+location.pathname+'?phase=worker','a18-initial-race');
 check('two-tab-initial-window-created',Boolean(initTab));
 for(let i=0;i<100&&!initTab.__WORKER_READY__;i++)await sleep(50);
 check('two-tab-initial-window-ready',Boolean(initTab.__WORKER_READY__));
 const bothInitial=await Promise.allSettled([P.commit(null,initial),initTab.A18P2Store.commit(null,initial)]);
 check('two-tab-first-boot-single-winner',bothInitial.filter(x=>x.status==='fulfilled').length===1&&bothInitial.filter(x=>x.status==='rejected').length===1);
 initTab.close();
 let save=await P.load();
 check('initial-atomic-record',save.revision===0&&save.fixtures.length===28&&save.progression.events.length===1);
 let initialRace=false;try{await P.commit(null,initial)}catch(e){initialRace=e.code==='E_SAVE_CONFLICT';}
 check('second-first-boot-rejected',initialRace);
 save=P.copy(save);let profile=P.copy(save);profile.revision++;profile.playerName='合成館長';profile.avatarGender='female';profile.museumTitle='合成とっておき美術館';profile.pos={x:326,y:425,dir:'up',stride:0};await P.commit(save.revision,profile);save=await P.load();
 check('profile-transaction',save.playerName==='合成館長'&&save.avatarGender==='female'&&save.revision===1);
 // First room's 3 display frames trigger Lv2 only when third artwork is committed.
 for(let i=0;i<3;i++){
   const candidate=P.copy(save),frame='frame-0-'+i,art=sample('synthetic-'+i,frame);
   candidate.works.push(art);candidate.fixtures.find(f=>f.id===frame).workId=art.id;
   const plan=P.plan(save,candidate);check('plan-level-'+i,plan.nextSave.progression.unlockedThroughLevel===(i===2?2:1));
   if(i===2)check('lv2-event-once',plan.transition?.eventId==='lv2-v1'&&plan.nextSave.progression.events.filter(e=>e.id==='lv2-v1').length===1);
   await P.commit(plan.expectedRevision,plan.nextSave);save=await P.load();
 }
 check('lv2-award-and-open',save.progression.unlockedThroughLevel===2&&save.progression.awardedRoomIds.join(',')==='0'&&save.progression.newRoomNotices.join(',')==='1');
 check('locked-east-after-lv2',!P.canTraverse(0,'east',save.progression));
 let event=P.eventAction(save,'intro-v1','finish');await P.commit(save.revision,event);save=await P.load();
 check('event-seen-persisted',save.progression.events.find(e=>e.id==='intro-v1').status==='seen');
 event=P.eventAction(save,'lv2-v1','skip');await P.commit(save.revision,event);save=await P.load();
 check('event-available-persisted',save.progression.events.find(e=>e.id==='lv2-v1').status==='available');
 // Carrying work coexists with photos exhibited and must restore.
 let carry=P.copy(save);carry.works.push(sample('synthetic-held',null));carry.carrying='synthetic-held';carry.revision++;
 await P.commit(save.revision,carry);save=await P.load();
 check('carry-and-fixture-links-valid',P.validate(save).ok&&save.works.length===4);
 check('hydrate-creates-only-runtime-urls',P.hydrate(save.works).every(w=>w.originalURL.startsWith('blob:')));
 const packed=P.persisted({...save,works:P.hydrate(save.works)});
 check('transient-url-not-persisted',packed.works.every(w=>!('originalURL' in w)));
 // Explicit failure injection in actual v3 IndexedDB transaction (not actual full disk).
 for(const fail of ['abort','quota']){
   const pre=await P.load(),next=P.copy(pre);next.revision++;next.museumTitle='MUST NOT SAVE '+fail;
   // Fault only in this isolated QA harness; production JS exposes no injection API.
   const original=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(...args){if(this.transaction.mode==='readwrite'&&this.name===STORE)throw new DOMException('Synthetic fault',fail==='quota'?'QuotaExceededError':'AbortError');return original.apply(this,args)};
   let rejected=false;
   try{await P.commit(pre.revision,next)}catch(e){rejected=e.code==='E_TX_ABORT'||e.code==='QuotaExceededError'}
   finally{IDBObjectStore.prototype.put=original}
   const actual=await P.load();
   check('injected-'+fail+'-does-not-commit',rejected&&actual.revision===pre.revision&&actual.museumTitle===pre.museumTitle);
 }
 // Two separate browsing windows, sharing one origin/DB; force competing snapshots.
 const win=window.open(location.origin+location.pathname+'?phase=worker&p2-e2e=1','a18-synthetic-other-tab');
 check('second-browser-window-created',!!win);
 for(let i=0;i<100&&!win.__WORKER_READY__;i++)await sleep(50);
 check('second-browser-window-loaded',!!win.__WORKER_READY__);
 const a=await P.load(),b=await win.A18P2Store.load();
 const x=P.copy(a),y=win.A18P2Store.copy(b);
 x.revision++;y.revision++;x.museumTitle='CAS-A';y.museumTitle='CAS-B';
 const winner=await Promise.allSettled([P.commit(a.revision,x),win.A18P2Store.commit(b.revision,y)]);
 const live=await P.load();
 check('two-tab-cas-exactly-one-winner',winner.filter(q=>q.status==='fulfilled').length===1&&winner.filter(q=>q.status==='rejected').length===1,winner.map(q=>q.status));
 check('two-tab-cas-no-mixed-state',live.museumTitle==='CAS-A'||live.museumTitle==='CAS-B');
 win.close();
 // Save corruption cannot initialize, but current low-level commit still does not validate live data.
 const db=await open(NAME),snapshot=await get(db);
 let corrupt=P.copy(snapshot);corrupt.schemaVersion=907;await put(db,corrupt);
 let blocked=false;try{await P.load()}catch(e){blocked=e.code==='E_SCHEMA_UNKNOWN';}
 check('unknown-schema-load-hard-stops',blocked);
 let unsafe=P.copy(snapshot);unsafe.revision++;unsafe.museumTitle='unsafe-after-corrupt';
 let declined=false;try{await P.commit(snapshot.revision,unsafe)}catch(e){declined=e.code==='E_SAVE_LIVE_CORRUPT'}
 r.observations.liveCorruptOverwritePrevented=declined;
 check('corrupt-live-blocks-valid-commit',declined);
 check('corrupt-live-unchanged',(await get(db)).schemaVersion===907);
 await put(db,snapshot);
 let broken=P.copy(snapshot);broken.works[0].originalBlob=null;await put(db,broken);
 blocked=false;try{await P.load()}catch(e){blocked=e.code==='E_BLOB_MISSING';}
 check('blob-missing-load-hard-stops',blocked);
 await put(db,snapshot);
 let invalid=P.copy(snapshot);invalid.progression.unlockedThroughLevel=19;await put(db,invalid);
 blocked=false;try{await P.load()}catch(e){blocked=e.code==='E_PROGRESSION_INVARIANT';}
 check('invalid-progression-hard-stops',blocked);
 await put(db,snapshot);
 // Stored null at an existing key must NOT be misclassified as an empty DB.
 await put(db,null);
 blocked=false;try{await P.load()}catch(e){blocked=e.code==='E_SCHEMA_UNKNOWN'}
 check('stored-null-load-not-new-game',blocked);
 let nullOverwriteBlocked=false;
 try{const next=P.copy(snapshot);next.revision++;await P.commit(snapshot.revision,next)}
 catch(e){nullOverwriteBlocked=e.code==='E_SAVE_LIVE_CORRUPT'}
 check('stored-null-live-protected',nullOverwriteBlocked&&(await get(db))===null);
 await put(db,snapshot);db.close();
 const oldAfter=await oldEvidence();
 check('old-v2-unchanged-after-all-v3-actions',JSON.stringify(oldAfter)===JSON.stringify(oldBefore),{before:oldBefore,after:oldAfter});
 // Snapshot of commit input is cloned before async IndexedDB work.
 const stable=await P.load(),draft=P.copy(stable);draft.revision++;draft.museumTitle='SNAPSHOT-CORRECT';
 const pending=P.commit(stable.revision,draft);draft.museumTitle='MUTATED-BY-CALLER';
 await pending;
 check('structured-clone-on-entry',(await P.load()).museumTitle==='SNAPSHOT-CORRECT');
 // Each malformed save must be rejected with the existing record unchanged.
 const baseline=await P.load(),baselineEvidence=JSON.stringify(await evidence(baseline));
 const mutations=[
  ['bad-schema',s=>s.schemaVersion=8],
  ['bad-revision',s=>s.revision=-1],
  ['missing-blob',s=>s.works[0].originalBlob=null],
  ['empty-blob',s=>s.works[0].originalBlob=new Blob([])],
  ['duplicate-work-id',s=>s.works[1].id=s.works[0].id],
  ['bad-fixture-reference',s=>s.works[0].fixtureId='frame-unknown'],
  ['carrying-conflict',s=>s.carrying=s.works[0].id],
  ['locked-gallery',s=>s.galleryIndex=5],
  ['bad-position',s=>s.pos.x=-4],
  ['unknown-event',s=>s.progression.events.push({id:'intruder-v1',status:'seen',origin:'play'})],
  ['migration-origin',s=>s.progression.events[0].origin='migration']
 ];
 for(const [name,mutate] of mutations){
  const candidate=P.copy(baseline);candidate.revision++;mutate(candidate);
  let denied=false;try{await P.commit(baseline.revision,candidate)}catch(e){denied=Boolean(e.code)}
  check('malformed-candidate-'+name,denied);
 }
 check('all-bad-candidates-left-live-intact',JSON.stringify(await evidence(await P.load()))===baselineEvidence);
 const final=await P.load();sessionStorage.setItem('expectedSave',JSON.stringify(await evidence(final)));
 sessionStorage.setItem('initialPhaseResults',JSON.stringify(r));
 r.observations.oldStoreNeverAutomaticallyReadOrDeleted=true;
 report();return;
}
if(phase==='restore'){
 const s=await P.load(),expected=JSON.parse(sessionStorage.getItem('expectedSave'));
 check('fresh-browser-navigation-restores-all-persisted-fields',JSON.stringify(await evidence(s))===JSON.stringify(expected));
 check('stored-blob-hashes-match',expected.works.length===4&&expected.works.every(w=>w.sha256?.length===64));
 check('lv2-not-rolled-back',s.progression.unlockedThroughLevel===2);
 check('profile-restored',s.playerName==='合成館長'&&s.avatarGender==='female');
 check('carry-restored',s.carrying==='synthetic-held');
 check('event-replay-state-restored',s.progression.events.some(e=>e.id==='intro-v1'&&e.status==='seen'));
 check('fixture-ids-and-links-restored',expected.fixtures.length===28&&expected.fixtures.filter(f=>f.workId).length===3);
 check('old-v2-still-intact',JSON.stringify(await oldEvidence())===sessionStorage.getItem('legacy'));
 // All other 25 slots, plus held work, produce exactly 28 exhibits and six levels.
 let save=await P.load();
 for(let room=1;room<=5;room++){
  for(let slot=0;slot<5;slot++){
   const frame='frame-'+room+'-'+slot, candidate=P.copy(save);
   if(room===1&&slot===0){
    const held=candidate.works.find(w=>w.id==='synthetic-held');held.fixtureId=frame;
    candidate.carrying=null;
   }else candidate.works.push(sample('synthetic-'+room+'-'+slot,frame));
   L.syncWorks(candidate.fixtures,candidate.works);
   const planned=P.plan(save,candidate);
   await P.commit(planned.expectedRevision,planned.nextSave);
   save=await P.load();
  }
  check('room-'+room+'-completed',save.progression.awardedRoomIds.includes(room));
  check('room-'+room+'-level',save.progression.unlockedThroughLevel===Math.min(6,room+2));
 }
 check('all-28-exhibited',save.works.length===28&&save.works.every(w=>w.fixtureId!==null));
 check('seven-unique-events',save.progression.events.length===7&&new Set(save.progression.events.map(e=>e.id)).size===7);
 check('all-14-portal-directions',Object.entries(L.ROOM_LINKS).reduce((n,[from,edges])=>n+Object.keys(edges).filter(dir=>P.canTraverse(Number(from),dir,save.progression)).length,0)===14);
 check('all-p5-levels-covered',save.progression.unlockedThroughLevel===6);
 // Work lift, storage, replace, memo and deletion are separately committed, no partial writes.
 const beforeWork=await evidence(save),a=save.works[0],b=save.works[1],af=a.fixtureId,bf=b.fixtureId;
 let moved=P.copy(save);moved.works.find(w=>w.id===a.id).fixtureId=null;moved.carrying=a.id;L.syncWorks(moved.fixtures,moved.works);
 let planned=P.plan(save,moved);await P.commit(planned.expectedRevision,planned.nextSave);save=await P.load();
 check('lift-carry-atomically',save.carrying===a.id&&save.works.find(w=>w.id===a.id).fixtureId===null);
 let swapped=P.copy(save);swapped.works.find(w=>w.id===a.id).fixtureId=bf;swapped.works.find(w=>w.id===b.id).fixtureId=null;swapped.carrying=b.id;
 L.syncWorks(swapped.fixtures,swapped.works);planned=P.plan(save,swapped);await P.commit(planned.expectedRevision,planned.nextSave);save=await P.load();
 check('swap-atomically',save.carrying===b.id&&save.works.find(w=>w.id===a.id).fixtureId===bf);
 let restored=P.copy(save);restored.works.find(w=>w.id===b.id).fixtureId=bf;restored.works.find(w=>w.id===a.id).fixtureId=af;restored.carrying=null;
 restored.works.find(w=>w.id===a.id).notes='メモ更新／original bytes protected';
 L.syncWorks(restored.fixtures,restored.works);planned=P.plan(save,restored);await P.commit(planned.expectedRevision,planned.nextSave);save=await P.load();
 check('memo-and-return-preserve-work-id',save.works.find(w=>w.id===a.id).notes.includes('original bytes protected'));
 check('work-ids-stable',save.works.map(w=>w.id).join('|')===beforeWork.works.map(w=>w.id).join('|'));
 for(const ev of save.progression.events.filter(e=>e.status!=='seen')){
  const updated=P.eventAction(save,ev.id,'finish');
  await P.commit(save.revision,updated);save=await P.load();
 }
 check('seven-events-seen',save.progression.events.every(e=>e.status==='seen'));
 check('final-28-and-6',save.works.length===28&&save.progression.unlockedThroughLevel===6);
 sessionStorage.setItem('fullExpected',JSON.stringify(await evidence(save)));
 report();return;
}
if(phase==='full-restore'){
 const s=await P.load(),expected=JSON.parse(sessionStorage.getItem('fullExpected'));
 check('28-works-full-blob-hash-restore',JSON.stringify(await evidence(s))===JSON.stringify(expected));
 check('all-seven-events-reloaded',s.progression.events.length===7&&s.progression.events.every(e=>e.status==='seen'));
 check('28-frames-28-pictures',s.fixtures.filter(f=>f.kind==='frame'&&f.workId).length===28);
 check('all-rooms-unlocked',s.progression.unlockedThroughLevel===6);
 check('old-v2-still-intact-after-full',JSON.stringify(await oldEvidence())===sessionStorage.getItem('legacy'));
 const reduced=P.copy(s),removed=reduced.works.pop();reduced.fixtures.find(f=>f.id===removed.fixtureId).workId=null;
 reduced.revision++;
 await P.commit(s.revision,reduced);
 check('deleting-one-work-removes-only-selected', (await P.load()).works.length===27);
 const restore=P.copy(reduced);restore.works.push(removed);restore.fixtures.find(f=>f.id===removed.fixtureId).workId=removed.id;restore.revision++;
 await P.commit(reduced.revision,restore);
 check('restore-originals-byte-for-byte',JSON.stringify(await evidence(await P.load()))===JSON.stringify({...expected,revision:restore.revision}));
 report();return;
}
throw Error('Unknown phase '+phase);
}catch(e){r.fatal={message:String(e),stack:e.stack};report();}
})();