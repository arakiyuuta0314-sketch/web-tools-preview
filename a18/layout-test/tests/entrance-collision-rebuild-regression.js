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
assert.deepEqual(blocks[0],L.npcBounds('butler',0));
for(const [x,y] of [[80,320],[480,320],[450,400],[280,220],[116,237],[439,237]]){
 assert.equal(L.walkable(x,y,f,0),true,'unexpected entrance obstacle '+x+','+y);
}
for(const [x,y] of [[280,209],[280,160],[139,343]]){
 assert.equal(L.walkable(x,y,f,0),false,'missing wall/butler collision '+x+','+y);
}
assert.deepEqual(L.anchor(f[0],0),{x:116,y:237});
assert.deepEqual(L.anchor(f[1],0),{x:439,y:237});
for(let room=1;room<=5;room++){
 assert(L.obstacles(f,room).length>=1,'non-entrance obstacles lost '+room);
}
assert(L.validatePlacement(f,0).ok,'entrance reachable floor & two exhibit targets');
console.log('PASS: entrance rear wall, butler body, two rear-frame interaction anchors, old partition removal, legacy fixture retention, entrance route validation');
