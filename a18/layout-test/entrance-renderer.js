/* A18 approved initial architectural background (2026-10-27).
   Keep the approved PNG intact; only draw it with aspect-ratio-preserving crop.
   Legacy independent foreground sprites await art review; no save writes. */
(()=>{'use strict';
const ROOT='assets/entrance/v09/';
const FILES={
 background:['assets/entrance/approved_initial_20261027/entrance_background_initial_approved.png',1322,1190],
 counter:['assets/entrance/counter_candidate_20261028/reception_lshape_lv1_approved_v11.webp',936,428],
 partition:['assets/entrance/counter_candidate_20261028/partition_left_oak_lv1_approved_v11.png',860,488],
 right_partition:['assets/entrance/counter_candidate_20261028/partition_right_lv1_approved_v11.png',860,488],
 sage:['assets/entrance/counter_candidate_20261028/reception_collage_sage_v11.png',246,180],
 blue:['assets/entrance/counter_candidate_20261028/reception_collage_blue_v11.png',178,178],
 ochre:['assets/entrance/counter_candidate_20261028/reception_collage_ochre_v11.png',174,138],
 notice:['assets/entrance/counter_candidate_20261028/reception_collage_notice_v11.png',282,212],
 rose:['assets/entrance/counter_candidate_20261028/reception_collage_rose_v11.png',146,128],
 rear_left:[ROOT+'rear_left_photo_mask_v09.png',546,483],
 rear_right:[ROOT+'rear_right_photo_mask_v09.png',546,483]
};
const PANELS=[
 {name:'rear_left',rect:[43,64,189,143],patch:[38,58,195,151],center:[116,105]},
 {name:'rear_right',rect:[374,64,506,143],patch:[369,58,511,151],center:[440,105]},
 // Rect is centered on the actual right partition's visible teal inset
 // (sprite inset x=135..790, y=59..333 -> game center approximately 464,296).
 // Keep photo size 136x74 and move it +11x/-4y relative to former art position.
 {name:'front',rect:[396,259,532,333]}
];
const imgs=new Map(),masks=new Map();
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
 for(const p of PANELS.filter(x=>x.name!=='front')){
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
// Visual review candidate: original counter illustration, no changes to approved background.
// Requested provisional placement: original counter image moved 15 px down, no scaling.
function counter(ctx){check();ctx.drawImage(imgs.get('counter'),...window.A18Layout.ENTRANCE_LV1.counter.image);}
// Keep the accepted v09 wood intact and translate the whole independent wall down 15 px.
function partition(ctx){check();ctx.drawImage(imgs.get('partition'),...window.A18Layout.ENTRANCE_LV1.leftWall.image);}
// Five individual paper layers: overlap, different tilts/stock and a natural collage.
// Rearmost paper first; neither timber nor its position is ever changed.
const PAPER_POSITIONS=[
 ['sage',23,246,61.5,45],
 ['blue',98,243,44.5,44.5],
 ['ochre',133,238,43.5,34.5],
 ['notice',45,232,70.5,53],
 ['rose',133,264,36.5,32]
];
function papers(ctx){check();for(const [key,x,y,w,h] of PAPER_POSITIONS)ctx.drawImage(imgs.get(key),x,y,w,h);}
function partitionRight(ctx){check();ctx.drawImage(imgs.get('right_partition'),...window.A18Layout.ENTRANCE_LV1.rightWall.image);}
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
 if(p.name==='front'){
  // Artwork determines the whole mounted frame, not just the pixels inside a
  // permanently landscape-shaped slot. Preserve the approved landscape bounds.
  const shape=img?.naturalWidth?shapeOf(f,img,preferred):(preferred||'landscape');
  if(!['portrait','landscape','square'].includes(shape))throw Error('E_RIGHT_WALL_FRAME_SHAPE');
  let w=r[2]-r[0],h=r[3]-r[1];
  if(shape==='portrait'){
   const ratio=img?.naturalWidth?img.naturalWidth/img.naturalHeight:0.7;
   if(!(ratio>0&&Number.isFinite(ratio)))throw Error('E_RIGHT_WALL_FRAME_RATIO');
   // Thin frame follows image aspect while staying within the right partition.
   const iw=Math.min(90,102*ratio);
   w=iw+10;h=112;
  }else if(shape==='square'){w=100;h=100;}
  const cx=(r[0]+r[2])/2,cy=shape==='landscape'?(r[1]+r[3])/2:303;
  const outer={x:cx-w/2,y:cy-h/2,w,h};
  const inner={x:outer.x+5,y:outer.y+5,w:w-10,h:h-10};
  if(outer.x<386||outer.x+outer.w>541||outer.y<240||outer.y+outer.h>367)throw Error('E_RIGHT_WALL_FRAME_BOUNDS');
  return {outer,inner,shape};
 }
 if(!img?.naturalWidth)return {outer:{x:r[0],y:r[1],w:r[2]-r[0],h:r[3]-r[1]},inner:{x:r[0],y:r[1],w:r[2]-r[0],h:r[3]-r[1]},shape:'landscape'};
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
function rear(ctx,p,f,img,preferred,woodFrame){
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
 ctx.restore();if(woodFrame)drawHighResolutionFrame(ctx,outer);
}
function rightPartitionPhoto(ctx,f,img,preferred){
 const {outer,inner}=frameGeometry(f,img,preferred);
 const {x,y,w,h}=outer;
 const iw=img.naturalWidth,ih=img.naturalHeight;
 if(!(iw>0&&ih>0))throw Error('E_RIGHT_WALL_PHOTO_INVALID');
 const mode=f.imageMode||'cover';
 if(!['cover','contain','custom'].includes(mode))throw Error('E_RIGHT_WALL_PHOTO_MODE');
 const fit=Math.max(inner.w/iw,inner.h/ih);
 const zoom=mode==='custom'?(f.imageScale??1):1, dw=iw*fit*zoom,dh=ih*fit*zoom;
 const dx=inner.x+(inner.w-dw)/2+(mode==='custom'?(inner.w-dw)*(f.imageX??0)/2:0);
 const dy=inner.y+(inner.h-dh)/2+(mode==='custom'?(inner.h-dh)*(f.imageY??0)/2:0);
 ctx.save();
 // A narrow dark-wood raised lip, no backing board or cream mat.
 ctx.fillStyle='rgba(29,20,14,.36)';ctx.fillRect(x+3,y+4,w,h);
 ctx.fillStyle='#54341d';ctx.fillRect(x-3,y-3,w+6,h+6);
 ctx.fillStyle='#a47846';ctx.fillRect(x-1,y-1,w+2,h+2);
 ctx.fillStyle='#1a322c';ctx.fillRect(inner.x,inner.y,inner.w,inner.h);
 ctx.beginPath();ctx.rect(inner.x,inner.y,inner.w,inner.h);ctx.clip();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(img,dx,dy,dw,dh);
 ctx.restore();
}
function frame(ctx,f,img,preferred=null,woodFrame=true){
 check();const p=panel(f);
 if(!img?.naturalWidth)return;
 if(p.name==='front'){rightPartitionPhoto(ctx,f,img,preferred);return;}
 rear(ctx,p,f,img,preferred,woodFrame);
}
function markSlot(ctx,f,img=null,preferred=null){
 check();const p=panel(f),r=p.rect;
 ctx.save();ctx.strokeStyle='#76b18a';ctx.lineWidth=3;ctx.beginPath();
 const {outer}=frameGeometry(f,img,preferred);
 ctx.rect(outer.x-3,outer.y-3,outer.w+6,outer.h+6);
 ctx.stroke();ctx.restore();
}
window.A18Entrance={init,background,foreground,counter,partition,papers,partitionRight,frame,frameGeometry,markSlot,assetCount:()=>imgs.size,ready:()=>ready};
})();