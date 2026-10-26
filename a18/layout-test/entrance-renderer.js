/* A18 clean entrance redraw — independently generated blank architectural base.
   Preserve saved fixture IDs, adaptive frames, and original-resolution photo path.
   This is isolated artwork QA only until explicitly adopted on main. */
(()=>{'use strict';
const ROOT='assets/entrance/v11/',PW=768,PH=576;
const FILES={
 background:[ROOT+'entrance_clean_redraw_546x483.png',546,483],
 front:[ROOT+'front_photo_mask_v11.png',546,483],
 atlas:['assets/entrance/v0.3/entrance_frame_9slice_atlas_v03.png',42,42]
};
const PANELS=[
 {name:'rear_left',rect:[49,37,188,137],center:[116,86]},
 {name:'rear_right',rect:[370,37,506,137],center:[440,86]},
 {name:'front',rect:[419,168,506,344]}
];
const FRONT_INV=[
 [2.216924002295637,-0.007588637919303665,-830.1781549075595],
 [-0.015016830300470565,0.8098809352560739,-59.00931708526596],
 [0.0037950319523461914,-0.00009034092761076227,-0.4149636016721955]
];
const FRONT_QUAD=[[419,168],[505,194],[504,343],[419,285]];
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
 const c=blank(),cx=c.getContext('2d',{willReadFrequently:true});
 cx.drawImage(imgs.get('front'),0,0);
 const d=cx.getImageData(0,0,546,483).data,m=new Uint8Array(546*483);
 let count=0;
 for(let i=0;i<m.length;i++){m[i]=d[i*4];if(m[i])count++;}
 if(count<8000||count>15000)throw Error('E_ENTRANCE_V11_FRONT_MASK '+count);
 masks.set('front',m);
 ready=true;
}
function background(ctx){check();ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(imgs.get('background'),0,0);ctx.restore();}
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
 const caps=sh==='portrait'?[94,95]:sh==='square'?[94,94]:[140,81];
 const factor=Math.min(caps[0]/ratio,caps[1]),w=ratio*factor,h=factor;
 const outerW=w+16,outerH=h+16,x=p.center[0]-outerW/2,y=p.center[1]-outerH/2;
 if(x<27||x+outerW>522||y<28||y+outerH>142)throw Error('E_ENTRANCE_V11_BOUNDS '+f.id);
 return {outer:{x,y,w:outerW,h:outerH},inner:{x:x+8,y:y+8,w,h},shape:sh};
}
function nineSlice(ctx,r){
 const atlas=imgs.get('atlas'),b=8,s=14;
 const dx=[r.x,r.x+b,r.x+r.w-b],dy=[r.y,r.y+b,r.y+r.h-b];
 const w=[b,r.w-2*b,b],h=[b,r.h-2*b,b];
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(let y=0;y<3;y++)for(let x=0;x<3;x++){
  if(x===1&&y===1)continue;
  ctx.drawImage(atlas,x*s,y*s,s,s,dx[x],dy[y],w[x],h[y]);
 }
 ctx.restore();
}
function rear(ctx,p,f,img,preferred){
 const {outer,inner}=frameGeometry(f,img,preferred);
 // Blank walls are part of the new redraw; no old matte/repair overlay is used.
 ctx.fillStyle='rgba(18,15,12,.54)';ctx.fillRect(outer.x+2,outer.y+3,outer.w,outer.h);
 ctx.fillStyle='#a99675';ctx.fillRect(outer.x+5,outer.y+5,outer.w-10,outer.h-10);
 const sw=img.naturalWidth,sh=img.naturalHeight,mode=f.imageMode||'cover';
 if(!['cover','contain','custom'].includes(mode))throw Error('E_ENTRANCE_V10_MODE');
 const fit=mode==='contain'?Math.min(inner.w/sw,inner.h/sh):Math.max(inner.w/sw,inner.h/sh);
 const zoom=mode==='custom'?(f.imageScale??1):1;
 const dw=sw*fit*zoom,dh=sh*fit*zoom;
 const ox=mode==='custom'?(inner.w-dw)*(f.imageX??0)/2:0;
 const oy=mode==='custom'?(inner.h-dh)*(f.imageY??0)/2:0;
 ctx.save();ctx.beginPath();ctx.rect(inner.x,inner.y,inner.w,inner.h);ctx.clip();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(img,inner.x+(inner.w-dw)/2+ox,inner.y+(inner.h-dh)/2+oy,dw,dh);
 ctx.restore();nineSlice(ctx,outer);
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
 const key=[f.id,preferred,f.imageMode,f.imageScale,f.imageX,f.imageY].join('|');
 let m=cache.get(img);if(!m){m=new Map();cache.set(img,m);}
 if(!m.has(key)){
  const c=p.name==='front'?front(img,f):blank();
  if(p.name!=='front')rear(c.getContext('2d'),p,f,img,preferred);
  m.set(key,c);
 }
 ctx.drawImage(m.get(key),0,0);
 if(p.name==='front'){
  ctx.save();ctx.beginPath();
  ctx.moveTo(FRONT_QUAD[0][0],FRONT_QUAD[0][1]);
  for(let i=1;i<4;i++)ctx.lineTo(FRONT_QUAD[i][0],FRONT_QUAD[i][1]);
  ctx.closePath();ctx.strokeStyle='#5b3418';ctx.lineWidth=5;ctx.stroke();
  ctx.strokeStyle='#c49a56';ctx.lineWidth=2;ctx.stroke();ctx.restore();
 }
}
function markSlot(ctx,f,img=null,preferred=null){
 check();const p=panel(f),r=p.rect;
 ctx.save();ctx.strokeStyle='#76b18a';ctx.lineWidth=3;ctx.beginPath();
 if(p.name==='front'){
  ctx.moveTo(FRONT_QUAD[0][0],FRONT_QUAD[0][1]);
  for(let i=1;i<4;i++)ctx.lineTo(FRONT_QUAD[i][0],FRONT_QUAD[i][1]);
  ctx.closePath();
 }else{
  const {outer}=frameGeometry(f,img,preferred);
  ctx.rect(outer.x-3,outer.y-3,outer.w+6,outer.h+6);
 }
 ctx.stroke();ctx.restore();
}
window.A18Entrance={init,background,foreground,frame,frameGeometry,markSlot,assetCount:()=>imgs.size,ready:()=>ready};
})();