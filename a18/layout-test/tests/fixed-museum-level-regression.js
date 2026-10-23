global.window=global;
require('../layout-system.js');
require('../museum-progression.js');
const L=A18Layout,P=A18MuseumProgression;
const levels=[[0,1],[4,1],[5,2],[11,2],[12,3],[19,3],[20,4],[30,4]];
for(const [workCount,level] of levels){
 if(P.levelFor(workCount)!==level)throw Error('Unexpected level at '+workCount);
}
const original=L.defaults(),migrated=JSON.parse(JSON.stringify(original));
migrated[0].x+=14;migrated[1].width-=7;
if(L.enforceFixedLayout(migrated)!==2)throw Error('Expected two modified frames to normalize');
for(let i=0;i<original.length;i++)for(const key of ['x','y','width','height','installation']){
 if(migrated[i][key]!==original[i][key])throw Error('Frame deviates from fixed template '+i+' '+key);
}
if(L.enforceFixedLayout(migrated)!==0)throw Error('Normalization should be idempotent');
for(let room=0;room<6;room++){
 if(!L.validatePlacement(original,room).ok)throw Error('Invalid fixed room '+room);
 const p=L.STAFF_POSITIONS[room];
 if(room===0){if(p)throw Error('Entr. must have no staff');continue;}
 if(!p)throw Error('Missing gallery staff '+room);
 if(!L.walkable(p.x,p.y+54,original,room))throw Error('NPC cannot be approached from south '+room);
 const hits=original.filter(f=>f.roomId===room&&f.installation==='floor');
 for(const f of hits){
  const [l,t,r,b]=L.r(f);
  if(p.x+20>l&&p.x-20<r&&p.y+16>t&&p.y-30<b)throw Error('NPC overlaps fixed exhibition '+room+' '+f.id);
 }
}
console.log('PASS curated gallery layout, level 1-4 thresholds, and five nonblocking staff positions');

require('../staff-flow.js');
const originalRandom=Math.random;
Math.random=()=>.9999;
try{
 const title='桜のパズル';
 const staffText=A18Registration.chatText('staff','ゆう','female',[{title}]);
 const butlerText=A18Registration.chatText('butler','ゆう','female',[{title}]);
 if(!staffText.includes('ゆうさん')||!staffText.includes(title))throw Error('Staff did not praise named work');
 if(!butlerText.includes('ゆうお嬢様')||!butlerText.includes(title))throw Error('Butler did not praise named work');
 console.log('PASS named registered artwork in positive random conversations for both NPC roles');
}finally{Math.random=originalRandom;}
