/* A18: canonical 48 characters and preserved experimental fixture art. No approved asset is modified. */
(()=>{'use strict';
const cache=new Map();
let manifest=null;
const loaded=path=>{const im=cache.get(path);return im&&im.complete&&im.naturalWidth>0?im:null};
function fetchImage(path){
 if(!path)throw Error('素材のパスが未定義です');
 const existing=cache.get(path);
 if(existing)return Promise.resolve(existing);
 return new Promise((resolve,reject)=>{
  const img=new Image();
  img.onload=()=>{cache.set(path,img);resolve(img)};
  img.onerror=()=>reject(Error('正式候補素材を読み込めません：'+path));
  img.src=path;
 });
}
async function init(candidate){
 if(!candidate?.officialCharacterFiles||candidate.officialCharacterFiles.length!==48)
  throw Error('正式採用48キャラクターの定義が欠損しています');
 // Experimental furniture and frame PNGs are archived, but are not loaded
 // in a fixed-layout production preview. The approved characters alone run.
 const files=[...candidate.officialCharacterFiles];
 const ids=new Set(files.map(f=>f.path));
 if(ids.size!==files.length)throw Error('素材manifestに重複パスがあります');
 // Avoid dozens of simultaneous decodes on mobile Safari and local preview servers.
 for(let i=0;i<files.length;i+=6)await Promise.all(files.slice(i,i+6).map(f=>fetchImage(f.path)));
 manifest=candidate;
 return {loaded:cache.size,paths:[...cache.keys()]};
}
function alphaDraw(ctx,path,bbox,box){
 const img=loaded(path);
 if(!img||!bbox)throw Error('候補素材の画像または透過範囲が読み込めません：'+path);
 const [x,y,x2,y2]=bbox;
 ctx.drawImage(img,x,y,x2-x,y2-y,box.x,box.y,box.w,box.h);
}
function npc(ctx,name,x,footY){
 const meta=manifest?.[name],img=meta&&loaded(meta.path);
 if(!img)return false;
 const w=meta.size.width,h=meta.size.height;
 const footFraction=meta.footBaselinePx/meta.sourceSize[1];
 ctx.drawImage(img,x-w/2,footY-h*footFraction,w,h);
 return true;
}
function decoration(ctx,f){
 const meta=manifest?.decor?.[f.type];
 if(!meta||!loaded(meta.path))return false;
 const b=meta.alphaBBox,ratio=(b[3]-b[1])/(b[2]-b[0]);
 const visibleW=f.width,visibleH=visibleW*ratio;
 // The footprint is f.width x f.height; transparent overhead is not a collision.
 const footY=f.y+f.height/2;
 alphaDraw(ctx,meta.path,b,{x:f.x-visibleW/2,y:footY-visibleH,w:visibleW,h:visibleH});
 return true;
}
const rectangle=f=>[f.x-f.width/2,f.y-f.height/2,f.x+f.width/2,f.y+f.height/2];
function displayShape(f,img,preferredShape){
 if(f.shape==='portrait'||f.shape==='square')return f.shape;
 const sourceRatio=img?.naturalHeight>0?img.naturalHeight/img.naturalWidth:null;
 // Portrait photos registered with "show whole photo" automatically get a tall frame;
 // their original picture and saved fixture geometry remain untouched.
 if(f.imageMode==='contain'){
  if(preferredShape==='portrait'||(preferredShape!=='landscape'&&sourceRatio>1.15))return 'portrait';
  if(preferredShape==='square'||(preferredShape!=='landscape'&&sourceRatio>=.88&&sourceRatio<=1.15))return 'square';
 }
 return 'landscape';
}
function frameBounds(f,img,allFrames=[],preferredShape=null){
 const mode=displayShape(f,img,preferredShape);
 const L=window.A18Layout;
 const room=L?.ROOM_SIZE?.[f.roomId];
 if(!room)throw Error('額縁の部屋情報が不正です：'+f.id);
 let w,h;
 if(mode==='portrait'){
  h=Math.min(126,Math.max(120,f.height*1.22));
  // A photograph's actual aspect ratio defines its inner aperture. The old
  // constant .71 created blank strips beside narrower portrait photos.
  const ratio=img?.naturalWidth>0&&img?.naturalHeight>0
   ?img.naturalWidth/img.naturalHeight
   :preferredShape==='portrait'?.67:.71;
  w=h*Math.max(.22,Math.min(.87,ratio));
 }else if(mode==='square'){
  const size=Math.min(118,Math.max(f.width,f.height)*1.14);
  w=size;h=size;
 }else{
  w=f.width*1.14;
  h=f.height*1.10;
 }
 // Share narrow gaps between neighboring fixtures instead of letting frames
 // overlap, especially when several frames hang side by side on one wall.
 let leftLimit=30,rightLimit=room.w-30,nearestGap=Infinity;
 for(const other of allFrames){
  if(other.id===f.id||other.roomId!==f.roomId||other.kind!=='frame'||
     other.installation!==f.installation)continue;
  if(Math.abs(other.y-f.y)>(other.height+f.height)/2+18)continue;
  const b=rectangle(f),o=rectangle(other);
  if(o[2]<=b[0]){
   const gap=b[0]-o[2];
   nearestGap=Math.min(nearestGap,gap);
   leftLimit=Math.max(leftLimit,b[0]-Math.max(0,(gap-26)/2));
  }else if(o[0]>=b[2]){
   const gap=o[0]-b[2];
   nearestGap=Math.min(nearestGap,gap);
   rightLimit=Math.min(rightLimit,b[2]+Math.max(0,(gap-26)/2));
  }
 }
 // Allow at most the drawable width between allocated boundaries.
 // Unlike fixed fixture coordinates, a smaller footprint does not change saves.
 const allowedW=Math.min(w,2*(f.x-leftLimit),2*(rightLimit-f.x));
 if(!Number.isFinite(allowedW)||allowedW<18)throw Error('額縁の表示領域が不正です：'+f.id);
 if(mode==='portrait'&&allowedW<w){h*=allowedW/w;}
 w=allowedW;
 let cx=f.x,cy=f.y;
 if(f.installation==='wall'){
  const top=34,bottom=room.wallFoot-3;
  const allowedH=Math.min(h,bottom-top);
  if(mode==='portrait'&&allowedH<h)w*=allowedH/h;
  h=allowedH;
  cy=Math.max(top+h/2,Math.min(bottom-h/2,cy));
  // Don't grow into the actual north doorway.
  const north=L?.ROOM_LINKS?.[f.roomId]?.north;
  if(north!=null&&cx+w/2>338&&cx-w/2<398&&cy+h/2>77){
   const leftSpace=338-(cx-w/2),rightSpace=(cx+w/2)-398;
   const maxRight=2*(338-cx),maxLeft=2*(cx-398);
   const safeWidth=Math.max(maxRight,maxLeft);
   if(safeWidth>0&&safeWidth<w){if(mode==='portrait')h*=safeWidth/w;w=safeWidth;}
  }
 }else{
  cx=Math.max(32+w/2,Math.min(room.w-32-w/2,cx));
 }
 // Reduce decorative rim only in densely packed rows. This prevents the
 // frame border itself from overlapping a neighbor's border.
 const rim=Number.isFinite(nearestGap)?
  Math.max(3,Math.min(12,(nearestGap-Math.max(0,w-f.width))/2-1)):12;
 return {x:cx-w/2,y:cy-h/2,w,h,shape:mode,rim};
}
function frame(ctx,f,img,allFrames=[],preferredShape=null){
 const b=frameBounds(f,img,allFrames,preferredShape);
 const x=b.x,top=b.y,w=b.w,h=b.h,right=x+w,bottom=top+h,rim=b.rim;
 // Program-drawn frame, not the unapproved PNG. Slightly enlarged with a
 // visibly taller shape for a portrait photograph.
 if(f.installation==='floor'){
  ctx.fillStyle='#ad9880';ctx.fillRect(x-rim*.67,top-rim,w+rim*1.34,h+rim*1.92);
  ctx.fillStyle='#8b775b';ctx.fillRect(x-rim*.83,bottom+rim-1,w+rim*1.66,8);
 }
 ctx.fillStyle='#845c34';ctx.fillRect(x-rim,top-rim,w+2*rim,h+2*rim);
 const gold=ctx.createLinearGradient(x-rim*.67,top-rim*.67,right+rim*.67,bottom+rim*.67);
 gold.addColorStop(0,'#f3e2ac');gold.addColorStop(.5,'#9d6d31');gold.addColorStop(1,'#e8c77e');
 ctx.fillStyle=gold;ctx.fillRect(x-rim*.75,top-rim*.75,w+1.5*rim,h+1.5*rim);
 ctx.fillStyle='#43352b';ctx.fillRect(x-3,top-3,w+6,h+6);
 if(f.design==='wood'){
  ctx.fillStyle='#8c5a36';ctx.fillRect(x-rim*.67,top-rim*.67,w+1.34*rim,h+1.34*rim);
  ctx.strokeStyle='#e0b878';ctx.lineWidth=2;ctx.strokeRect(x-rim*.42,top-rim*.42,w+.84*rim,h+.84*rim);
 }
 ctx.save();
 ctx.beginPath();ctx.rect(x,top,w,h);ctx.clip();
 ctx.fillStyle='#ddcfad';ctx.fillRect(x,top,w,h);
 if(img&&img.naturalWidth>0){
  const sw=img.naturalWidth,sh=img.naturalHeight,mode=f.imageMode||'cover';
  const fit=mode==='contain'?Math.min(w/sw,h/sh):Math.max(w/sw,h/sh);
  const scale=fit*(mode==='custom'?(f.imageScale||1):1);
  const dw=sw*scale,dh=sh*scale;
  const ox=mode==='custom'?(w-dw)*(f.imageX||0)/2:0;
  const oy=mode==='custom'?(h-dh)*(f.imageY||0)/2:0;
  ctx.drawImage(img,x+(w-dw)/2+ox,top+(h-dh)/2+oy,dw,dh);
 }else if(!f.workId){
  ctx.fillStyle='#9e8c71';ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.font='bold 20px serif';ctx.fillText('+',b.x+b.w/2,b.y+b.h/2+6);
 }else{
  ctx.fillStyle='#49372c';ctx.fillRect(x,top,w,h);
 }
 ctx.restore();
}

window.A18Art={init,npc,decoration,frame,frameBounds,displayShape,get:loaded,get manifest(){return manifest},stats:()=>({loaded:cache.size,paths:[...cache.keys()]})};
})();
