/* A18 entrance v0.3: isolated visual layers; gameplay coordinates and stores are unchanged. */
(()=>{'use strict';
const ROOT='assets/entrance/v0.3/';
const ITEMS={
 floor:['entrance_floor_base_v03.png',546,483],
 wall:['entrance_wall_base_v03.png',546,483],
 carpet:['entrance_carpet_v03.png',546,483],
 sidewalls:['entrance_sidewalls_v03.png',546,483],
 north:['entrance_door_north_v03.png',76,170],
 west:['entrance_door_west_v03.png',64,112],
 east:['entrance_door_east_v03.png',64,112],
 frame:['entrance_frame_horizontal_v03.png',100,77],
 portraitDemo:['entrance_frame_portrait_demo_v03.png',62,122],
 squareDemo:['entrance_frame_square_demo_v03.png',90,90],
 atlas:['entrance_frame_9slice_atlas_v03.png',42,42],
 plant:['entrance_plant_v03.png',65,98],
 light:['entrance_wall_light_v03.png',26,38],
 glow:['entrance_wall_glow_v03.png',546,483],
 plaque:['entrance_plaque_blank_v03.png',101,23]
};
const images=new Map();
let ready=false;
async function init(){
 if(ready)return;
 // A missing asset is a fatal, visible boot error, never a silent placeholder.
 for(const [key,[filename,width,height]] of Object.entries(ITEMS)){
  const im=await new Promise((resolve,reject)=>{
   const image=new Image();
   image.onload=()=>resolve(image);
   image.onerror=()=>reject(Error('エントランスv0.3素材を読み込めません：'+ROOT+filename));
   image.src=ROOT+filename;
  });
  if(im.naturalWidth!==width||im.naturalHeight!==height)
   throw Error('エントランスv0.3素材の寸法が不正：'+filename);
  images.set(key,im);
 }
 ready=true;
}
function requireReady(){
 if(!ready)throw Error('エントランスv0.3画像の読み込みが未完了');
}
function place(ctx,key,x,y){
 const im=images.get(key);
 if(!im)throw Error('未定義のエントランス素材：'+key);
 ctx.drawImage(im,x,y);
}
function background(ctx){
 requireReady();
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#d4c6ad';ctx.fillRect(0,0,546,483);
 place(ctx,'floor',0,0);
 place(ctx,'wall',0,0);
 place(ctx,'carpet',0,0);
 place(ctx,'sidewalls',0,0);
 place(ctx,'north',328,69);
 place(ctx,'west',0,326);
 place(ctx,'east',482,326);
 place(ctx,'glow',0,0);
 place(ctx,'light',168,90);
 ctx.restore();
}
function foreground(ctx){
 requireReady();
 ctx.save();ctx.imageSmoothingEnabled=false;
 place(ctx,'plant',422,205);
 ctx.restore();
}
// The atlas is 3 x 3 patches, each exactly 14 px.
// Nine-slice destinations are 9 px on each side, so the transparent central
// window is precisely aligned to the photographed rectangle.
function nineSlice(ctx,outer){
 const atlas=images.get('atlas');
 if(!atlas)throw Error('9-sliceの額縁素材がありません');
 const b=9,s=14;
 const dx=[outer.x,outer.x+b,outer.x+outer.w-b];
 const dy=[outer.y,outer.y+b,outer.y+outer.h-b];
 const dw=[b,outer.w-2*b,b],dh=[b,outer.h-2*b,b];
 if(dw[1]<0||dh[1]<0)throw Error('額縁の表示寸法が小さすぎます');
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(let iy=0;iy<3;iy++)for(let ix=0;ix<3;ix++){
  if(ix===1&&iy===1)continue; // full transparency for the work
  ctx.drawImage(atlas,ix*s,iy*s,s,s,dx[ix],dy[iy],dw[ix],dh[iy]);
 }
 ctx.restore();
}
function frameGeometry(f,img,preferredShape=null){
 // Coordinates remain anchored to the three existing frames, without
 // changing fixture geometry or persisted IDs.
 const shape=(preferredShape==='portrait'||preferredShape==='square')?preferredShape:window.A18Art.displayShape(f,img,preferredShape);
 let maxW=82,maxH=59;
 if(shape==='portrait'){maxW=82;maxH=104;}
 if(shape==='square'){maxW=72;maxH=72;}
 let innerW=maxW,innerH=maxH;
 const hasPhoto=img&&img.naturalWidth>0&&img.naturalHeight>0;
 if(hasPhoto){
  const ratio=img.naturalWidth/img.naturalHeight;
  // Size the photo window to the actual original aspect ratio for every shape.
  // This avoids off-ratio matting and unnecessary cropping, even in cover mode.
  const size=Math.min(maxW/ratio,maxH);
  innerW=size*ratio;innerH=size;
 }
 // Protect the 40 x 40 minimum frame without inserting white padding.
 const outerW=Math.max(40,innerW+18),outerH=Math.max(40,innerH+18);
 // The left/right frame windows can be tall, but must remain within the wall.
 const x=f.x-outerW/2;
 const y=Math.max(34,Math.min(199-outerH,f.y-outerH/2));
 const outer={x,y,w:outerW,h:outerH};
 return {outer,inner:{x:x+(outerW-innerW)/2,y:y+(outerH-innerH)/2,w:innerW,h:innerH},shape};
}
function frame(ctx,f,img,preferredShape=null){
 requireReady();
 const {outer,inner}=frameGeometry(f,img,preferredShape);
 // The shadow is BEHIND the art. Never darken the photograph with a mat overlay.
 ctx.save();
 ctx.fillStyle='#271f17a0';
 ctx.fillRect(outer.x+2,outer.y+3,outer.w,outer.h);
 ctx.fillStyle='#b9a783';
 ctx.fillRect(outer.x+9,outer.y+9,outer.w-18,outer.h-18);
 if(img&&img.naturalWidth>0){
  const sw=img.naturalWidth,sh=img.naturalHeight,mode=f.imageMode||'cover';
  const fit=mode==='contain'?Math.min(inner.w/sw,inner.h/sh):Math.max(inner.w/sw,inner.h/sh);
  const scale=fit*(mode==='custom'?(f.imageScale||1):1);
  const dw=sw*scale,dh=sh*scale;
  const ox=mode==='custom'?(inner.w-dw)*(f.imageX||0)/2:0;
  const oy=mode==='custom'?(inner.h-dh)*(f.imageY||0)/2:0;
  ctx.beginPath();ctx.rect(inner.x,inner.y,inner.w,inner.h);ctx.clip();
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(img,inner.x+(inner.w-dw)/2+ox,inner.y+(inner.h-dh)/2+oy,dw,dh);
 }else if(!f.workId){
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#826e4c';ctx.font='bold 22px serif';
  ctx.fillText('+',inner.x+inner.w/2,inner.y+inner.h/2);
 }else{
  ctx.fillStyle='#45372c';ctx.fillRect(inner.x,inner.y,inner.w,inner.h);
 }
 ctx.restore();
 nineSlice(ctx,outer);
}
window.A18Entrance={init,background,foreground,frame,frameGeometry,assetCount:()=>images.size,ready:()=>ready};
})();