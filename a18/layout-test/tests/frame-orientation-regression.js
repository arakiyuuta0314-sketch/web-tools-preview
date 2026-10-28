global.window=global;
require('../layout-system.js');require('../asset-renderer.js');require('../museum-navigation.js');
const L=A18Layout,Art=A18Art,fixtures=L.defaults();
const portrait={naturalWidth:600,naturalHeight:900};
const square={naturalWidth:800,naturalHeight:800};
const landscape={naturalWidth:1200,naturalHeight:800};
const galleryRoomIds=[0,1,2,3,4,5];
let wider=0,notWider=0;
for(const room of galleryRoomIds){
 const frames=fixtures.filter(f=>f.roomId===room);
 for(const f of frames){
  const test={...f,imageMode:'contain'};
  for(const [shape,img] of [['landscape',landscape],['portrait',portrait],['square',square]]){
   const b=Art.frameBounds(test,img,frames);
   if(b.shape!==shape)throw Error('Wrong image adaptive orientation: '+f.id+' '+shape+' '+b.shape);
   if(b.w<18||b.h<40||!Number.isFinite(b.x)||!Number.isFinite(b.y))throw Error('Invalid bounds '+f.id);
   if(f.installation==='wall'){
    if(b.y<34-1e-6||b.y+b.h>L.ROOM_SIZE[room].wallFoot-3+1e-6)throw Error('Outside wall: '+f.id+' '+shape);
   }
   if(shape==='landscape'){if(b.w>f.width+1)wider++;else notWider++;}
  }
 }
}
if(wider<15)throw Error('Too few frames increased size: '+wider);
const frame=fixtures[0],others=fixtures.filter(f=>f.roomId===0);
const bLandscape=Art.frameBounds(frame,landscape,others);
const bPortrait=Art.frameBounds({...frame,imageMode:'contain'},portrait,others);
if(!(bPortrait.h>=118 && bPortrait.h>bPortrait.w && bPortrait.h>bLandscape.h))throw Error('Portrait remains small/horizontal');
if(!(bLandscape.w>frame.width))throw Error('Entrance frames did not enlarge');
console.log('PASS all '+fixtures.length+' frames: landscape/portrait/square rendering, '+wider+' frames wider, '+notWider+' constrained');
console.log('Entr. landscape',bLandscape,'portrait',bPortrait);

const rect=b=>[b.x-b.rim,b.y-b.rim,b.x+b.w+b.rim,b.y+b.h+b.rim];
const overlaps=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
for(const room of galleryRoomIds){
 const frames=fixtures.filter(f=>f.roomId===room);
 for(const [title,img] of [['landscape',landscape],['portrait',portrait],['square',square]]){
  let colliding=[];
  const rendered=frames.map(f=>({f,b:Art.frameBounds({...f,imageMode:'contain'},img,frames)}));
  for(let a=0;a<rendered.length;a++)for(let b=a+1;b<rendered.length;b++){
   if(rendered[a].f.installation!==rendered[b].f.installation)continue;
   if(overlaps(rect(rendered[a].b),rect(rendered[b].b)))colliding.push(rendered[a].f.id+' / '+rendered[b].f.id);
  }
  if(colliding.length)throw Error('Displayed frame rims overlap room='+room+' shape='+title+' pairs='+colliding.join(','));
 }
}
