global.window=global;
require('../layout-system.js');
require('../museum-navigation.js');
const L=window.A18Layout,N=window.A18Navigation;
if(!N.validateGraph(L.ROOM_LINKS))throw Error('Invalid six-room map');
const initial=L.defaults();
const works=[{id:'test1',fixtureId:initial[0].id}];
initial[0].workId='test1';
const saved=JSON.parse(JSON.stringify(initial));
for(const f of saved.filter(f=>f.kind==='frame')){
 const r=L.BASE[f.roomId][Number(f.id.split('-')[2])];
 f.width=Math.round((r[2]-r[0])*1.17*10)/10;
 f.height=Math.round((r[3]-r[1])*1.085*10)/10;
 f.sizingVersion=2;
}
const moved=saved.find(f=>f.id==='frame-0-1');
const exactBefore={x:moved.x+5,width:moved.width+3};
moved.x=exactBefore.x;moved.width=exactBefore.width;
const reverted=L.restoreClassicFrameDimensions(saved);
if(reverted!==initial.length-1)throw Error('Expected '+(initial.length-1)+' untouched auto zoom frames, got '+reverted);
const a=saved[0],b=initial[0];
if(a.width!==b.width||a.height!==b.height)throw Error('Original classic dimensions not restored');
if(moved.x!==exactBefore.x||moved.width!==exactBefore.width)throw Error('User edited fixture modified');
if(saved[0].workId!==works[0].id)throw Error('Art linkage destroyed');
if(L.restoreClassicFrameDimensions(saved)!==0)throw Error('Frame migration is not idempotent');
L.assertData(saved,works);
console.log('PASS restore of '+(initial.length-1)+' automatically inflated frames; 1 deliberately edited stays unchanged, work assignment and idempotence preserved');
