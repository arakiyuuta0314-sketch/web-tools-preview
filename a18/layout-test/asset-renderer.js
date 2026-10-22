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
 if(!candidate?.allCandidateFiles||candidate.allCandidateFiles.length!==24)
  throw Error('既存の仮展示設備24素材が不足しています');
 const files=[...candidate.officialCharacterFiles,...candidate.allCandidateFiles];
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
function frame(ctx,f,img){
 const [x,top,right,bottom]=rectangle(f),w=right-x,h=bottom-top;
 // Restore v1.8's large, programmatically drawn frame (12px outer rim),
 // not the unapproved shrunken transparent-PNG frame candidate.
 // Rendering geometry is separate from fixture and interaction coordinates.
 if(f.installation==='floor'){
  ctx.fillStyle='#ad9880';ctx.fillRect(x-8,top-12,w+16,h+23);
  ctx.fillStyle='#8b775b';ctx.fillRect(x-10,bottom+11,w+20,9);
 }
 ctx.fillStyle='#845c34';ctx.fillRect(x-12,top-12,w+24,h+24);
 const gold=ctx.createLinearGradient(x-8,top-8,right+8,bottom+8);
 gold.addColorStop(0,'#f3e2ac');gold.addColorStop(.5,'#9d6d31');gold.addColorStop(1,'#e8c77e');
 ctx.fillStyle=gold;ctx.fillRect(x-9,top-9,w+18,h+18);
 ctx.fillStyle='#43352b';ctx.fillRect(x-3,top-3,w+6,h+6);
 if(f.design==='wood'){
  ctx.fillStyle='#8c5a36';ctx.fillRect(x-8,top-8,w+16,h+16);
  ctx.strokeStyle='#e0b878';ctx.lineWidth=2;ctx.strokeRect(x-5,top-5,w+10,h+10);
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
  ctx.font='bold 20px serif';ctx.fillText('+',f.x,f.y+6);
 }else{
  ctx.fillStyle='#49372c';ctx.fillRect(x,top,w,h);
 }
 ctx.restore();
}

window.A18Art={init,npc,decoration,frame,get:loaded,get manifest(){return manifest},stats:()=>({loaded:cache.size,paths:[...cache.keys()]})};
})();
