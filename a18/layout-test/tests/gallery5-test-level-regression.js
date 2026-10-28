'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
global.window=global;
global.location={search:'?qa=1'};
require('../layout-system.js');
require('../museum-p2-storage.js');
const L=A18Layout,P=A18P2Store;
const makeWork=(id,fixtureId)=>({
 id,title:'QA '+id,notes:'',complete:null,registered:'2026-10-29',
 pieces:null,preferredShape:'landscape',thumbnail:null,displaySrc:null,
 fixtureId,originalBlob:new Blob(['original-'+id],{type:'image/png'})
});
assert.equal(P.TEST_MODE,true);
assert.equal(L.defaults().length,26);
assert.deepEqual(L.roomFrames(L.defaults(),5).map(x=>x.id),['frame-5-0','frame-5-1','frame-5-2']);
const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../assets/p5/v0.2/p5-manifest.json'),'utf8'));
assert.equal(manifest.frame_count,26);
assert.deepEqual(manifest.rooms['5'].fixture_ids,['frame-5-0','frame-5-1','frame-5-2']);

for(let level=1;level<=6;level++){
 const next=P.testSetLevel(P.makeInitialV3(),level);
 assert.equal(P.validate(next).frameCount,26);
 assert.equal(next.progression.unlockedThroughLevel,level);
 assert.equal(next.progression.awardedRoomIds.length,level-1);
 assert.equal(next.progression.events.length,level);
 for(let room=0;room<6;room++)
  for(const [dir,target] of Object.entries(L.ROOM_LINKS[room]))
   assert.equal(P.canTraverse(room,dir,next.progression),room<level&&target<level,
    'Lv.'+level+' '+room+' '+dir+' -> '+target);
}
let lv6=P.testSetLevel(P.makeInitialV3(),6);
lv6.galleryIndex=5;lv6.pos={x:296,y:420,dir:'up',stride:0};
P.validate(lv6);
const down=P.testSetLevel(lv6,2);
assert.equal(down.galleryIndex,0);
assert.equal(down.pos.x,326);
assert.equal(down.progression.unlockedThroughLevel,2);

// Real progression gates remain tied to full exhibition in each frontier room.
for(let room=0;room<5;room++){
 const prior=P.testSetLevel(P.makeInitialV3(),room+1);
 const next=P.copy(prior);
 for(const f of L.roomFrames(next.fixtures,room))next.works.push(makeWork('lv-'+room+'-'+f.id,f.id));
 L.syncWorks(next.fixtures,next.works);
 const result=P.plan(prior,next);
 assert.equal(result.transition.kind,'level');
 assert.equal(result.transition.openedRoomId,room+1);
 assert.equal(result.transition.eventId,'lv'+(room+2)+'-v1');
 assert.equal(result.nextSave.progression.unlockedThroughLevel,room+2);
}

const before=P.testSetLevel(P.makeInitialV3(),6),candidate=P.copy(before);
for(const f of L.roomFrames(candidate.fixtures,5))candidate.works.push(makeWork(f.id,f.id));
L.syncWorks(candidate.fixtures,candidate.works);
assert.equal(P.isRoomComplete(5,before.fixtures,before.works),false);
assert.equal(P.isRoomComplete(5,candidate.fixtures,candidate.works),true);
const final=P.plan(before,candidate);
assert.equal(final.transition.kind,'final');
assert.equal(final.transition.eventId,'gallery06-complete-v1');
assert.equal(final.nextSave.progression.unlockedThroughLevel,6);
assert.equal(P.validate(final.nextSave).frameCount,26);

const legacy=P.makeInitialV3();
for(let i=3;i<=4;i++){
 const old=JSON.parse(JSON.stringify(L.frameOf(legacy.fixtures,5,2)));
 old.id='frame-5-'+i;old.legacySlot=25+i;
 old.x=i===3?122:459;old.y=i===3?297:278;
 old.width=113;old.height=80;old.installation='floor';
 old.workId=i===4?'legacy-piece':null;
 legacy.fixtures.push(old);
}
legacy.works.push(makeWork('legacy-piece','frame-5-4'));
assert.throws(()=>P.validate(legacy),/E_FRAME_DUPLICATE/);
const migrated=P.migrateRetiredGallery5(legacy);
assert.equal(migrated.fixtures.length,26);
assert.equal(migrated.works.length,1);
assert.equal(migrated.works[0].fixtureId,null);
assert.equal(migrated.works[0].originalBlob.size,legacy.works[0].originalBlob.size);
assert.equal(migrated.works[0].title,'QA legacy-piece');
assert.equal(migrated.revision,legacy.revision+1);
assert.equal(P.validate(migrated).frameCount,26);
assert.equal(P.migrateRetiredGallery5(migrated),null);
console.log('PASS gallery5: 3 frames; 26 active frames; 6 QA levels; door locks; final completion; migration preserves original artwork');
