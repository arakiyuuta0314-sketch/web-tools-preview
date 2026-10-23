/* A18 P3 architecture / art; no gameplay state or database writes. */
(()=>{'use strict';
const BASE='assets/p3/v1/';
const POS={north:[329,53],south:[256,411],west:[0,326],east:[525,326]};
const E_POS={north:[328,69],west:[0,326],east:[482,326]};
const ORDER=['floor','wall','panel','trim','glow','light'];
const imgs=new Map();
let manifest=null,ready=false;
const image=(path)=>{const im=imgs.get(path);if(!ready||!im)throw Error('P3画像が準備されていません: '+path);return im;};
async function init(){
 if(ready)return;
 const r=await fetch('p3-architecture-manifest.json');
 if(!r.ok)throw Error('P3素材マニフェストの取得に失敗');
 const data=await r.json();
 const files=new Set();
 for(let i=1;i<=5;i++){
  const layers=data.galleryRooms[String(i)];
  if(!layers||ORDER.some(x=>!layers[x]))throw Error('P3展示室レイヤー欠損: '+i);
  ORDER.forEach(k=>files.add(layers[k]));
 }
 for(const dir of ['north','south','east','west']){
  if(!data.doors[dir]?.open||!data.doors[dir]?.locked)throw Error('P3扉の定義が不正: '+dir);
  files.add(data.doors[dir].open);files.add(data.doors[dir].locked);
 }
 if(!data.frames?.gold)throw Error('P3額縁がありません');
 files.add(data.frames.gold);
 const dim=(path)=>{
  if(path===data.frames.gold)return [42,42];
  if(path.includes('shared_doors'))return path.includes('north')?[76,170]:path.includes('south')?[76,71]:[64,112];
  return [589,482];
 };
 // Fail-fast for asset corruptions. Fetches are sequential to avoid Safari decode surges.
 for(const path of files){
  const im=await new Promise((resolve,reject)=>{
   const v=new Image();v.onload=()=>resolve(v);
   v.onerror=()=>reject(Error('P3素材を読み込めません: '+path));v.src=path;
  });
  const [w,h]=dim(path);
  if(im.naturalWidth!==w||im.naturalHeight!==h)throw Error('P3素材寸法不正: '+path);
  imgs.set(path,im);
 }
 manifest=data;ready=true;
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
 if(room<1||room>5)throw Error('P3背景の部屋IDが不正: '+room);
 if(!ready)throw Error('P3が未初期化');
 ctx.save();ctx.imageSmoothingEnabled=false;
 const layers=manifest.galleryRooms[String(room)];
 ctx.fillStyle='#d6cdb8';ctx.fillRect(0,0,589,482);
 for(const layer of ORDER)ctx.drawImage(image(layers[layer]),0,0);
 // P5 cumulative overlay: lighting -> decor -> doors -> art/actors/UI.
 window.A18P5Decorations.paint(ctx,room,progression);
 doors(ctx,room,progression);
 ctx.restore();
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
window.A18P3Gallery={init,background,doors,frame,states,ready:()=>ready,assetCount:()=>imgs.size,
 // Explicit contract only; not an attempt to load P5 before delivery.
 p5Slot:{after:'lighting',before:'doors',behind:['photographs','frames','actors','UI']}};
})();
