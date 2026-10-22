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
 const b=rectangle(f),[x,top,right,bottom]=b,w=right-x,h=bottom-top;
 const y=f.installation==='floor'?top-24:top;
 const style=f.design==='wood'?'wood':'gold',shape=f.shape||'landscape';
 const meta=manifest?.frames?.wall?.[style]?.[shape];
 // The graphic frame is cropped to its alpha bounding rectangle; the inner window stays transparent.
 const marginX=shape==='portrait'?.10:.075;
 const marginY=shape==='landscape'?.12:.075;
 const ix=x+w*marginX,iy=y+h*marginY,iw=w*(1-2*marginX),ih=h*(1-2*marginY);
 // The easel is always BEHIND the photo aperture and frame.
 if(f.installation==='floor'){
  const easel=manifest?.decor?.easel;
  if(easel&&loaded(easel.path)){
   const poleW=w*.65,b=easel.alphaBBox,ah=(b[3]-b[1])/(b[2]-b[0]);
   alphaDraw(ctx,easel.path,b,{x:f.x-poleW/2,y:bottom-poleW*ah,w:poleW,h:poleW*ah});
  }
 }

 ctx.save();
 ctx.beginPath();ctx.rect(ix,iy,iw,ih);ctx.clip();
 ctx.fillStyle='#dbcbb0';ctx.fillRect(ix,iy,iw,ih);
 if(img&&img.naturalWidth>0){
  const sw=img.naturalWidth,sh=img.naturalHeight,mode=f.imageMode||'cover';
  const fit=mode==='contain'?Math.min(iw/sw,ih/sh):Math.max(iw/sw,ih/sh);
  const scale=fit*(mode==='custom'?(f.imageScale||1):1);
  const dw=sw*scale,dh=sh*scale;
  const ox=mode==='custom'?(iw-dw)*(f.imageX||0)/2:0;
  const oy=mode==='custom'?(ih-dh)*(f.imageY||0)/2:0;
  ctx.drawImage(img,ix+(iw-dw)/2+ox,iy+(ih-dh)/2+oy,dw,dh);
 }else if(!f.workId){
  ctx.fillStyle='#7d674c';ctx.textAlign='center';ctx.font='bold '+Math.max(16,Math.min(iw,ih)*.38)+'px serif';
  ctx.fillText('+',f.x,f.y+6);
 }else{
  ctx.fillStyle='#49372c';ctx.fillRect(ix,iy,iw,ih);
 }
 ctx.restore();
 if(meta&&loaded(meta.path))alphaDraw(ctx,meta.path,meta.alphaBBox,{x,y,w,h});
 else{
  ctx.strokeStyle='#c39c58';ctx.lineWidth=8;ctx.strokeRect(x,y,w,h);
  ctx.strokeStyle='#694726';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
 }
}
window.A18Art={init,npc,decoration,frame,get:loaded,get manifest(){return manifest},stats:()=>({loaded:cache.size,paths:[...cache.keys()]})};
})();
