/* A18 P3 architecture / art; no gameplay state or database writes. */
(()=>{'use strict';
const BASE='assets/p3/v1/';
const POS={north:[329,53],south:[256,411],west:[0,326],east:[525,326]};
const E_POS={north:[328,69],west:[0,326],east:[482,326]};
const ORDER=['floor','wall','panel','trim','glow','light'];
const imgs=new Map();
let manifest=null,ready=false;
const APPROVED_SPEC='assets/approved-galleries/game-layout.json';
let approved=null;
function approvedRoom(room){
 if(!approved||!approved.rooms?.[String(room)])throw Error('E_APPROVED_GALLERY_MISSING '+room);
 return approved.rooms[String(room)];
}

const image=(path)=>{const im=imgs.get(path);if(!ready||!im)throw Error('P3画像が準備されていません: '+path);return im;};
const loading=new Map(),preparedRooms=new Set();
function dim(path){
 if(path.startsWith('assets/approved-galleries/')){
  for(let room=1;room<=5;room++){
   const o=approvedRoom(room).objects.find(x=>x.file===path);
   if(o)return o.size;
  }
  return [589,482];
 }
 if(path===manifest.frames.gold)return [42,42];
 if(path.includes('shared_doors'))return path.includes('north')?[76,170]:path.includes('south')?[76,71]:[64,112];
 return [589,482];
}
async function loadImage(path){
 if(imgs.has(path))return;
 if(loading.has(path))return loading.get(path);
 const promise=(async()=>{
  const im=await new Promise((resolve,reject)=>{
   const v=new Image();v.onload=()=>resolve(v);
   v.onerror=()=>reject(Error('E_P3_ASSET_LOAD '+path));
   // Avoid the previously deployed borderless room2 being returned from a
   // mobile browser's old PNG cache after the approved derived image changed.
   v.src=path+(path.endsWith('gallery2_game_589x482.png')?'?v=20261031-gallery2-north-double-door-v1':'');
  });
  const [w,h]=dim(path);
  if(im.naturalWidth!==w||im.naturalHeight!==h)throw Error('E_P3_ASSET_DIM '+path);
  imgs.set(path,im);
 })();
 loading.set(path,promise);
 try{await promise;}finally{loading.delete(path);}
}
async function init(){
 if(ready)return;
 const r=await fetch('p3-architecture-manifest.json');
 if(!r.ok)throw Error('E_P3_MANIFEST_FETCH');
 const data=await r.json();
 const artResponse=await fetch(APPROVED_SPEC,{cache:'no-store'});
 if(!artResponse.ok)throw Error('E_APPROVED_MANIFEST_FETCH');
 const newArt=await artResponse.json();
 if(newArt.schema!=='a18-native-gallery-v1'||newArt.logical[0]!==589||newArt.logical[1]!==482||
    Object.keys(newArt.rooms).length!==5)throw Error('E_APPROVED_MANIFEST_SCHEMA');
 approved=newArt;
 for(let i=1;i<=5;i++){
  const layers=data.galleryRooms[String(i)];
  if(!layers||ORDER.some(x=>!layers[x]))throw Error('E_P3_GALLERY_MANIFEST '+i);
 }
 for(const dir of ['north','south','east','west']){
  if(!data.doors[dir]?.open||!data.doors[dir]?.locked)throw Error('E_P3_DOOR_MANIFEST '+dir);
 }
 if(!data.frames?.gold)throw Error('E_P3_FRAME_MANIFEST');
 manifest=data;
 await loadImage(data.frames.gold);
 ready=true;
}
async function prepare(room){
 if(!ready)throw Error('E_P3_NOT_READY');
 if(!Number.isInteger(room)||room<1||room>5)throw Error('E_P3_ROOM '+room);
 if(preparedRooms.has(room))return;
 const art=approvedRoom(room);
 if(!Array.isArray(art.objects)||!art.image)throw Error('E_APPROVED_ROOM_SPEC '+room);
 const files=new Set([art.image,...art.objects.map(o=>o.file)]);
 // All older P3 door sprites are intentionally not drawn over architectural
 // openings already embedded into the newly approved wall texture.
 for(const dir of Object.keys(window.A18Layout.ROOM_LINKS[room])){
  files.add(manifest.doors[dir].open);
  files.add(manifest.doors[dir].locked);
 }
 const batch=[...files];
 for(let i=0;i<batch.length;i+=4)await Promise.all(batch.slice(i,i+4).map(loadImage));
 preparedRooms.add(room);
}
function locked(room,dir,progression){
 if(!progression)throw Error('P3扉判定の進行状態が欠損');
 return !window.A18P2Store.canTraverse(room,dir,progression);
}
function doors(ctx,room,progression,entrance=false){
 if(!ready)throw Error('P3が未初期化');
 const edges=window.A18Layout.ROOM_LINKS[room];
 const position=entrance?E_POS:POS;
 for(const dir of Object.keys(edges)){
  const p=position[dir];
  if(!p)throw Error('P3に存在しない扉: '+room+'/'+dir);
  // Entrance v0.3 already includes the open arch; only add wooden shutter.
  if(entrance){
   if(locked(room,dir,progression))ctx.drawImage(image(manifest.doors[dir].locked),p[0],p[1]);
  }else{
   ctx.drawImage(image(manifest.doors[dir].open),p[0],p[1]);
   if(locked(room,dir,progression))ctx.drawImage(image(manifest.doors[dir].locked),p[0],p[1]);
  }
 }
}
function background(ctx,room,progression){
 if(!preparedRooms.has(room))throw Error('E_P3_ROOM_NOT_PREPARED '+room);
 if(room<1||room>5)throw Error('P3背景の部屋IDが不正: '+room);
 if(!ready)throw Error('P3が未初期化');
 ctx.save();ctx.imageSmoothingEnabled=false;
 const art=approvedRoom(room);
 ctx.drawImage(image(art.image),0,0);
 // The approved PNG already contains architectural openings, wall carving,
 // gold highlights and flooring. Do not superimpose the obsolete P3/P5
 // full-room images or front-on door sprites.
 for(const dir of Object.keys(window.A18Layout.ROOM_LINKS[room])){
   if(!locked(room,dir,progression))continue;
   const rect=window.A18Navigation.portalEdges(room)[dir];
   if(!rect)throw Error('E_APPROVED_LOCKED_EDGE '+room+'/'+dir);
   const x=(rect.x1+rect.x2)/2,y=(rect.y1+rect.y2)/2;
   ctx.fillStyle='#30231de6';ctx.fillRect(x-15,y-15,30,30);
   ctx.strokeStyle='#b68b55';ctx.lineWidth=2;ctx.strokeRect(x-15,y-15,30,30);
   ctx.font='18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle='#e9cea0';ctx.fillText('🔒',x,y);
 }
 ctx.restore();
}
// Independent art panels remain separate so movement and photos can be
// revised without re-generating the approved architectural background.
function furniture(ctx,room){
 if(!preparedRooms.has(room))throw Error('E_APPROVED_ROOM_UNPREPARED '+room);
 for(const o of approvedRoom(room).objects)ctx.drawImage(image(o.file),o.x,o.y,o.w,o.h);
}
function nineSlice(ctx,rect){
 const atlas=image(manifest.frames.gold),s=14,b=9;
 const w=[b,rect.w-2*b,b],h=[b,rect.h-2*b,b];
 if(w[1]<0||h[1]<0)throw Error('P3額縁の寸法が小さすぎます');
 const xs=[rect.x,rect.x+b,rect.x+rect.w-b],ys=[rect.y,rect.y+b,rect.y+rect.h-b];
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(let y=0;y<3;y++)for(let x=0;x<3;x++){
  if(x===1&&y===1)continue;
  ctx.drawImage(atlas,x*s,y*s,s,s,xs[x],ys[y],w[x],h[y]);
 }
 ctx.restore();
}
function frame(ctx,f,photo,allFrames,shape){
 if(!ready)throw Error('P3が未初期化');
 // The adopted architecture and independent displays already contain their
 // empty viewing surfaces. Old P3 beige placeholder cards must not be painted
 // a second time over the new scene; a populated frame remains interactive.
 if(!photo||photo.naturalWidth<=0)return;
 // Gallery5's three ornate frames are already part of the approved v21 art.
 // Keep real registration/photos, but never paint a second square gold frame
 // on top of those permanently baked architectural surrounds.
 if(f.roomId===5){
   if(!photo||photo.naturalWidth<=0)return;
   const spots=[{x:131,y:94,w:62,h:106},{x:213,y:73,w:160,h:135},{x:396,y:94,w:65,h:106}];
   const id=Number(f.id.split('-')[2]);
   if(!Number.isInteger(id)||id<0||id>=3)throw Error('E_GALLERY5_FRAME_INDEX');
   const area=spots[id],ratio=Math.min(area.w/photo.naturalWidth,area.h/photo.naturalHeight);
   const w=photo.naturalWidth*ratio,h=photo.naturalHeight*ratio;
   ctx.save();ctx.fillStyle='#153b36';ctx.fillRect(area.x,area.y,area.w,area.h);
   ctx.drawImage(photo,area.x+(area.w-w)/2,area.y+(area.h-h)/2,w,h);
   ctx.restore();return;
 }
 // Shape is visual-only. Honor registered square/portrait originals even when
 // the saved crop mode is cover; never rewrite persisted fixture properties.
 const geometry=(shape==='square'||shape==='portrait')?{...f,imageMode:'contain'}:f;
 const outer=window.A18Art.frameBounds(geometry,photo,allFrames,shape);
 const b=9,inner={x:outer.x+b,y:outer.y+b,w:outer.w-2*b,h:outer.h-2*b};
 if(inner.w<1||inner.h<1)throw Error('P3額縁内寸法が無効: '+f.id);
 ctx.save();
 // Backing, shadow and photo stay INSIDE the frame. No opaque white artwork border.
 ctx.fillStyle='#261b18a0';ctx.fillRect(outer.x+2,outer.y+3,outer.w,outer.h);
 ctx.fillStyle='#baa687';ctx.fillRect(inner.x,inner.y,inner.w,inner.h);
 if(photo&&photo.naturalWidth>0){
  const sw=photo.naturalWidth,sh=photo.naturalHeight,mode=f.imageMode||'cover';
  const fit=mode==='contain'?Math.min(inner.w/sw,inner.h/sh):Math.max(inner.w/sw,inner.h/sh);
  const scale=fit*(mode==='custom'?(f.imageScale||1):1);
  const w=sw*scale,h=sh*scale;
  const ox=mode==='custom'?(inner.w-w)*(f.imageX||0)/2:0;
  const oy=mode==='custom'?(inner.h-h)*(f.imageY||0)/2:0;
  ctx.beginPath();ctx.rect(inner.x,inner.y,inner.w,inner.h);ctx.clip();
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(photo,inner.x+(inner.w-w)/2+ox,inner.y+(inner.h-h)/2+oy,w,h);
 }else if(!f.workId){
  ctx.fillStyle='#806d55';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 21px serif';ctx.fillText('+',inner.x+inner.w/2,inner.y+inner.h/2);
 }else{ctx.fillStyle='#49372c';ctx.fillRect(inner.x,inner.y,inner.w,inner.h);}
 ctx.restore();
 nineSlice(ctx,outer);
}
function states(room,progression){
 return Object.fromEntries(Object.keys(window.A18Layout.ROOM_LINKS[room]).map(dir=>[dir,locked(room,dir,progression)?'LOCKED':'OPEN']));
}
window.A18P3Gallery={init,prepare,background,furniture,doors,frame,states,ready:()=>ready,assetCount:()=>imgs.size,
 // Explicit contract only; not an attempt to load P5 before delivery.
 p5Slot:{after:'lighting',before:'doors',behind:['photographs','frames','actors','UI']}};
})();
