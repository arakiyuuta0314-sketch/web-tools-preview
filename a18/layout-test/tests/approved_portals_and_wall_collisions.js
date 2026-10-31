'use strict';
const assert=require('node:assert/strict');
global.window=global;
require('../layout-system.js');
require('../museum-navigation.js');
const L=global.A18Layout,N=global.A18Navigation,F=L.defaults();
const path=require('node:path'),fs=require('node:fs');
const art=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../assets/approved-galleries/game-layout.json'),'utf8'));
for(let room=1;room<=5;room++){
 const objs=art.rooms[String(room)].objects,feet=L.DISPLAY_FOOTPRINTS[room];
 assert.equal(feet.length,objs.length,'Footprint count changed from real room art '+room);
 for(let i=0;i<feet.length;i++){
  const [l,r,t,b]=feet[i],obj=objs[i],bottom=obj.y+obj.h;
  assert(l>=obj.x && r<=obj.x+obj.w && t>=bottom-31 && b<=bottom+12,
   'Footprint not based on actual displayed sprite '+room+'/'+obj.id);
 }
}
assert.equal(Object.keys(L.PASSAGES).length,6);
// Entrance side exits are the UPPER route behind the two independent art
// walls. The old bottom-left/bottom-right passage must never come back.
for(const dir of ['west','east']){
 const r=L.PASSAGES[0][dir];
 assert(r.y1>=225&&r.y2<=300,'Entrance side opening must be behind artwork, not on bottom');
 assert(insideSafeForEntrance(dir,r),'Side corridor interior not walkable');
}
function insideSafeForEntrance(dir,r){
 const x=dir==='west'?r.x1+16:r.x2-16;
 return L.walkable(x,(r.y1+r.y2)/2,L.defaults(),0);
}
assert(L.walkable(290,264,L.defaults(),0),'Upper lateral connecting walkway must stay open');
const reversed={north:'south',south:'north',east:'west',west:'east'};
let directions=0,routeChecks=0,reachable=0;
function pathGoal(r,dir){
 const b=L.PASSAGES[r][dir],cx=(b.x1+b.x2)/2,cy=(b.y1+b.y2)/2;
 return dir==='west'?[b.x1+14,cy]:dir==='east'?[b.x2-14,cy]:dir==='north'?[cx,b.y2-9]:[cx,b.y1+9];
}
const inside=(r,x,y)=>L.walkable(x,y,F,r);
for(let room=0;room<6;room++){
 const all=L.PASSAGES[room],links=L.ROOM_LINKS[room];
 assert.deepEqual(Object.keys(all).sort(),Object.keys(links).sort());
 assert.equal(N.portalEdges(room),all,'Navigation reuses exact layout passage');
 const anchor=room===0?[290,427]:[295,409];
 assert(inside(room,...anchor),'Central walkable spawn '+room);
 for(const [dir,target] of Object.entries(links)){
  directions++;
  assert.equal(L.ROOM_LINKS[target][reversed[dir]],room);
  assert(L.PASSAGES[target][reversed[dir]],'Missing reverse opening '+target);
  const entry=L.ARRIVALS[target][reversed[dir]];
  assert(inside(target,entry.x,entry.y),'Arrival stuck '+room+' '+dir+' ->'+target+' '+JSON.stringify(entry));
  const goal=pathGoal(room,dir);
  assert(inside(room,...goal),'Exit in wall '+room+' '+dir+' '+goal);
  routeChecks++;
 }
 if(room===0)continue;
 const staff=L.obstacles(F,room)[0],mx=(staff[0]+staff[1])/2,my=(staff[2]+staff[3])/2;
 assert(!inside(room,mx,my-5),'Staff must be solid in room '+room);
 for(const [l,r,t,b] of L.DISPLAY_FOOTPRINTS[room]){
  assert(!inside(room,(l+r)/2,(t+b)/2-5),'Standalone art collision '+room);
 }
 assert(inside(room,295,410),'Main aisle obstructed '+room);
 if(room===2){assert(!inside(room,25,151),'Gallery2 upper-left wall above west opening must be solid');assert(inside(room,25,244),'Gallery2 left upper entry must be walkable');assert(!inside(room,25,338),'Gallery2 left wall below passage must be solid');assert(!inside(room,562,220),'Gallery2 right wall must be solid');}
 if(room===5)assert(inside(room,295,350),'Gallery5 carpet must remain open');
}
assert.equal(directions,14);
const step=5;
for(let room=0;room<6;room++){
 const start=room===0?[290,427]:[295,409];
 const q=[start],seen=new Set([start.join(':')]);
 for(let i=0;i<q.length;i++){
  const [x,y]=q[i];
  for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const nx=x+dx,ny=y+dy,k=nx+':'+ny;
   if(nx<0||nx>590||ny<90||ny>480||seen.has(k)||!inside(room,nx,ny))continue;
   seen.add(k);q.push([nx,ny]);
  }
 }
 for(const [dir] of Object.entries(L.PASSAGES[room])){
  const goal=pathGoal(room,dir);
  assert(q.some(([x,y])=>Math.hypot(x-goal[0],y-goal[1])<=11),
   'NOT CONNECTED: room'+room+' '+dir+' goal '+goal+' samples '+q.length);
  reachable++;
 }
 console.log('PASS room'+room+': reachable '+q.length+' samples; '+Object.keys(L.PASSAGES[room]));
}
assert.equal(routeChecks,14);assert.equal(reachable,14);
console.log('PASS 14/14 exits physically reachable; staff/display/wall solid, obsolete frame footprints absent');
