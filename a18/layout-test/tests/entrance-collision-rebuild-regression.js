'use strict';
const assert=require('node:assert/strict');
global.window=global;
require('../layout-system.js');
const L=global.A18Layout,f=L.defaults();
assert.equal(f.length,28,'saved fixture schema unchanged');
assert.equal(L.roomFrames(f,0).length,3,'third stored fixture preserved');
assert.equal(L.ROOM_SIZE[0].wallFoot,210);
const blocks=L.obstacles(f,0);
assert.equal(blocks.length,1,'only butler should be a physical obstacle');
assert.deepEqual(blocks[0],[129,149,361,368],'butler collision limited to feet');
assert.equal(L.npcBounds('butler',0)[2]<blocks[0][2],true,'visual body larger than feet collision');
for(let x=90;x<=192;x+=3)assert.equal(L.walkable(x,335,f,0),true,'behind-butler continuous path '+x);
for(const [x,y] of [[80,320],[480,320],[450,400],[280,220],[116,237],[439,237]]){
 assert.equal(L.walkable(x,y,f,0),true,'unexpected entrance obstacle '+x+','+y);
}
for(const [x,y] of [[280,209],[280,160],[139,360]]){
 assert.equal(L.walkable(x,y,f,0),false,'missing wall/butler collision '+x+','+y);
}
assert.deepEqual(L.anchor(f[0],0),{x:116,y:237});
assert.deepEqual(L.anchor(f[1],0),{x:439,y:237});
for(let room=1;room<=5;room++){
 assert(L.obstacles(f,room).length>=1,'non-entrance obstacles lost '+room);
}
assert(L.validatePlacement(f,0).ok,'entrance reachable floor & two exhibit targets');
console.log('PASS: entrance rear wall, butler foot-only obstacle, clear rear walking lane, two frame anchors, save-safe fixtures');
