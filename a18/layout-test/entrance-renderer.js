/* A18 approved initial architectural background (2026-10-27).
   Keep the approved PNG intact; only draw it with aspect-ratio-preserving crop.
   Legacy independent foreground sprites await art review; no save writes. */
(()=>{'use strict';
const ROOT='assets/entrance/v09/',PW=768,PH=576;
const FILES={
 background:['assets/entrance/approved_initial_20261027/entrance_background_initial_approved.png',1322,1190],
 rear_left:[ROOT+'rear_left_photo_mask_v09.png',546,483],
 rear_right:[ROOT+'rear_right_photo_mask_v09.png',546,483],
 front:[ROOT+'front_photo_mask_v09.png',546,483]
};
const PANELS=[
 {name:'rear_left',rect:[43,64,189,143],patch:[38,58,195,151],center:[116,105]},
 {name:'rear_right',rect:[374,64,506,143],patch:[369,58,511,151],center:[440,105]},
 {name:'front',rect:[421,195,494,326]}
];
const FRONT_INV=[
 [2.2582576554692726,-0.02449889664425458,-854.9873467700153],
 [-0.2933780477833784,1.015847991558277,-7.050709650349285],
 [0.0032571841573975214,-0.000467047182836571,-0.18282765194690226]
];
const imgs=new Map(),masks=new Map(),cache=new WeakMap();
let ready=false;
function blank(w=546,h=483){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function check(){if(!ready)throw Error('E_ENTRANCE_V10_NOT_READY');}
async function init(){
 if(ready)return;
 for(const [key,[path,width,height]] of Object.entries(FILES)){
  const im=await new Promise((res,rej)=>{
   const x=new Image();x.onload=()=>res(x);
   x.onerror=()=>rej(Error('E_ENTRANCE_V10_IMAGE '+path));x.src=path;
  });
  if(im.naturalWidth!==width||im.naturalHeight!==height)throw Error('E_ENTRANCE_V10_DIM '+path);
  imgs.set(key,im);
 }
 for(const p of PANELS){
  const c=blank(),cx=c.getContext('2d',{willReadFrequently:true});
  cx.drawImage(imgs.get(p.name),0,0);
  const d=cx.getImageData(0,0,546,483).data,m=new Uint8Array(546*483);
  let count=0;
  for(let i=0;i<m.length;i++){m[i]=d[i*4];if(m[i])count++;}
  if(count<5000||count>20000)throw Error('E_ENTRANCE_V10_MASK '+p.name);
  masks.set(p.name,m);
 }
 ready=true;
}
function backgroundCrop(){
 const im=imgs.get('background');
 const h=im.naturalWidth*483/546;
 if(h>im.naturalHeight)throw Error('E_ENTRANCE_APPROVED_BG_RATIO');
 return {sourceY:(im.naturalHeight-h)/2,sourceH:h};
}
function background(ctx){
 check();const im=imgs.get('background'),{sourceY,sourceH}=backgroundCrop();
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(im,0,sourceY,im.naturalWidth,sourceH,0,0,546,483);
 ctx.restore();
}
function foreground(ctx){check();}
function panel(f){
 if(f?.roomId!==0)throw Error('E_ENTRANCE_V10_ROOM');
 const i=Number(f.id?.split('-')[2]);
 if(!Number.isInteger(i)||i<0||i>2||f.id!=='frame-0-'+i)throw Error('E_ENTRANCE_V10_FRAME '+f.id);
 return PANELS[i];
}
function shapeOf(f,img,preferred){
 if(['portrait','square','landscape'].includes(preferred))return preferred;
 if(f.shape==='portrait'||f.shape==='square')return f.shape;
 const ratio=img.naturalWidth/img.naturalHeight;
 return ratio<.88?'portrait':ratio<1.15?'square':'landscape';
}
function frameGeometry(f,img,preferred=null){
 const p=panel(f),r=p.rect;
 if(p.name==='front'||!img?.naturalWidth)return {outer:{x:r[0],y:r[1],w:r[2]-r[0],h:r[3]-r[1]},inner:{x:r[0],y:r[1],w:r[2]-r[0],h:r[3]-r[1]},shape:'landscape'};
 const ratio=img.naturalWidth/img.naturalHeight,sh=shapeOf(f,img,preferred);
 const caps=sh==='portrait'?[98,111]:sh==='square'?[100,100]:[133,85];
 const factor=Math.min(caps[0]/ratio,caps[1]),w=ratio*factor,h=factor;
 const outerW=w+16,outerH=h+16,x=p.center[0]-outerW/2,y=p.center[1]-outerH/2;
 if(x<27||x+outerW>522||y<40||y+outerH>184)throw Error('E_ENTRANCE_V10_BOUNDS '+f.id);
 return {outer:{x,y,w:outerW,h:outerH},inner:{x:x+8,y:y+8,w,h},shape:sh};
}
function drawHighResolutionFrame(ctx,r){
 // The legacy 42px 9-slice used a pale inner lip which looked white
 // around even uniform-color artwork. Draw its wood/gold bands at native
 // device resolution instead, keeping the existing 8px frame geometry.
 const bands=[
  '#322216', // outer dark wood silhouette
  '#926136', // warm brass / wood
  '#bd8951',
  '#a06c35',
  '#cf9b57', // restrained gold light on the external molding
  '#86562f',
  '#49301f',
  '#281f18'  // inner recess: deliberately never cream or white
 ];
 ctx.save();
 // Outline only: never paint over the photo's center.
 for(let i=0;i<bands.length;i++){
  ctx.strokeStyle=bands[i];ctx.lineWidth=1;
  ctx.strokeRect(r.x+i-.5,r.y+i-.5,r.w-2*i+1,r.h-2*i+1);
 }
 ctx.restore();
}
function rear(ctx,p,f,img,preferred){
 const {outer,inner}=frameGeometry(f,img,preferred),[x0,y0,x1,y1]=p.patch;
 const im=imgs.get('background'),{sourceY,sourceH}=backgroundCrop();
 ctx.drawImage(im,x0*im.naturalWidth/546,sourceY+y0*sourceH/483,
  (x1-x0)*im.naturalWidth/546,(y1-y0)*sourceH/483,x0,y0,x1-x0,y1-y0);
 ctx.fillStyle='rgba(18,15,12,.54)';ctx.fillRect(outer.x+2,outer.y+3,outer.w,outer.h);
 // Dark recessed inner rim, not a white or beige photographic mat.
 ctx.fillStyle='#3c2d21';ctx.fillRect(outer.x+5,outer.y+5,outer.w-10,outer.h-10);
 const sw=img.naturalWidth,sh=img.naturalHeight,mode=f.imageMode||'cover';
 if(!['cover','contain','custom'].includes(mode))throw Error('E_ENTRANCE_V10_MODE');
 // Even portrait works fill the measured artwork opening: no white gutters.
 const fit=Math.max(inner.w/sw,inner.h/sh);
 const zoom=mode==='custom'?(f.imageScale??1):1;
 const dw=sw*fit*zoom,dh=sh*fit*zoom;
 const ox=mode==='custom'?(inner.w-dw)*(f.imageX??0)/2:0;
 const oy=mode==='custom'?(inner.h-dh)*(f.imageY??0)/2:0;
 ctx.save();ctx.beginPath();ctx.rect(inner.x,inner.y,inner.w,inner.h);ctx.clip();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 // Gentle display-only contrast: improves perceived separation of fine puzzle
 // details, does not alter or re-encode the user's original saved photo.
 ctx.filter='contrast(1.055) saturate(1.02)';
 ctx.drawImage(img,inner.x+(inner.w-dw)/2+ox,inner.y+(inner.h-dh)/2+oy,dw,dh);
 ctx.restore();drawHighResolutionFrame(ctx,outer);
}
function front(img,f){
 const c=blank(PW,PH),cc=c.getContext('2d',{willReadFrequently:true});
 cc.fillStyle='#dcc7a3';cc.fillRect(0,0,PW,PH);
 const w=img.naturalWidth,h=img.naturalHeight,mode=f.imageMode||'cover';
 if(!['cover','contain','custom'].includes(mode))throw Error('E_ENTRANCE_V10_MODE');
 const fit=(mode==='contain'||w/h<.95)?Math.min(PW/w,PH/h):Math.max(PW/w,PH/h);
 const zoom=mode==='custom'?(f.imageScale??1):1,dw=w*fit*zoom,dh=h*fit*zoom;
 const ox=mode==='custom'?(PW-dw)*(f.imageX??0)/2:0;
 const oy=mode==='custom'?(PH-dh)*(f.imageY??0)/2:0;
 cc.imageSmoothingEnabled=true;cc.imageSmoothingQuality='high';
 cc.drawImage(img,(PW-dw)/2+ox,(PH-dh)/2+oy,dw,dh);
 const src=cc.getImageData(0,0,PW,PH).data,alpha=masks.get('front');
 const result=blank(),rc=result.getContext('2d'),image=rc.createImageData(546,483),dst=image.data,r=PANELS[2].rect,inv=FRONT_INV;
 // Direct bilinear sampling — previous 220x166 + Math.floor loop caused aliasing.
 for(let y=r[1];y<r[3];y++)for(let x=r[0];x<r[2];x++){
  const idx=y*546+x,a=alpha[idx];if(!a)continue;
  const px=x+.5,py=y+.5,div=inv[2][0]*px+inv[2][1]*py+inv[2][2];
  if(Math.abs(div)<1e-10)continue;
  const sx=(inv[0][0]*px+inv[0][1]*py+inv[0][2])/div;
  const sy=(inv[1][0]*px+inv[1][1]*py+inv[1][2])/div;
  const u=(sx-84)/110,v=(sy-61)/83;if(u<0||u>=1||v<0||v>=1)continue;
  const fx=Math.max(0,Math.min(PW-1,u*PW-.5)),fy=Math.max(0,Math.min(PH-1,v*PH-.5));
  const x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(PW-1,x0+1),y1=Math.min(PH-1,y0+1);
  const ax=fx-x0,ay=fy-y0,k=idx*4;
  for(let c=0;c<3;c++){
   const a0=src[(y0*PW+x0)*4+c],a1=src[(y0*PW+x1)*4+c];
   const b0=src[(y1*PW+x0)*4+c],b1=src[(y1*PW+x1)*4+c];
   dst[k+c]=Math.round((1-ay)*((1-ax)*a0+ax*a1)+ay*((1-ax)*b0+ax*b1));
  }
  dst[k+3]=a;
 }
 rc.putImageData(image,0,0);return result;
}
function frame(ctx,f,img,preferred=null){
 check();const p=panel(f);
 if(!img?.naturalWidth)return;
 if(p.name!=='front'){
  // Draw directly to the device-pixel-ratio canvas. The previous 546px
  // intermediate bitmap blurred photo detail when scaled on Retina iPhone.
  rear(ctx,p,f,img,preferred);
  return;
 }
 const key=[f.id,preferred,f.imageMode,f.imageScale,f.imageX,f.imageY].join('|');
 let m=cache.get(img);if(!m){m=new Map();cache.set(img,m);}
 if(!m.has(key))m.set(key,front(img,f));
 ctx.drawImage(m.get(key),0,0);
}
function markSlot(ctx,f,img=null,preferred=null){
 check();const p=panel(f),r=p.rect;
 ctx.save();ctx.strokeStyle='#76b18a';ctx.lineWidth=3;ctx.beginPath();
 if(p.name==='front'){
  ctx.moveTo(421.62,194.73);ctx.lineTo(493.79,228.73);
  ctx.lineTo(489.88,325.87);ctx.lineTo(421.00,277.57);ctx.closePath();
 }else{
  const {outer}=frameGeometry(f,img,preferred);
  ctx.rect(outer.x-3,outer.y-3,outer.w+6,outer.h+6);
 }
 ctx.stroke();ctx.restore();
}
window.A18Entrance={init,background,foreground,frame,frameGeometry,markSlot,assetCount:()=>imgs.size,ready:()=>ready};
})();