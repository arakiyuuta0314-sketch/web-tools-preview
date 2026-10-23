/* A18 P5 approved v0.2 cumulative decor; visual only, no state writes. */
(()=>{'use strict';
const ROOT='assets/p5/v0.2/';
const MANIFEST=ROOT+'p5-manifest.json';
const roomNames=['entrance','gallery02','gallery03','gallery04','gallery05','gallery06'];
const images=new Map();
let manifest=null,ready=false;
function levelOf(progression){
 const level=progression?.unlockedThroughLevel;
 if(!Number.isInteger(level)||level<1||level>6)throw Error('E_P5_LEVEL_INVALID');
 return level;
}
function assetPath(path){
 if(typeof path!=='string'||!/^01_assets\/(?:cumulative|increments)\/[a-z0-9_]+\.png$/.test(path)||path.includes('..'))
  throw Error('E_P5_MANIFEST_PATH '+path);
 return ROOT+path;
}
function validate(data){
 if(data?.version!=='full_6rooms_v0.2'||data.room_count!==6||data.frame_count!==28||data.portal_edge_count!==7)
  throw Error('E_P5_MANIFEST_VERSION');
 if(!data.rooms||typeof data.rooms!=='object'||!Array.isArray(data.assets)||data.assets.length!==66)
  throw Error('E_P5_MANIFEST_MISSING');
 const listed=new Map();
 for(const a of data.assets){
  if(!a||!Array.isArray(a.size)||!Number.isInteger(a.roomId)||typeof a.sha256!=='string'||!/^[0-9a-f]{64}$/.test(a.sha256))
   throw Error('E_P5_MANIFEST_ENTRY');
  const path=assetPath(a.path);
  if(listed.has(path))throw Error('E_P5_MANIFEST_DUPLICATE '+path);
  listed.set(path,a);
 }
 const paths=[];
 for(let room=0;room<6;room++){
  const spec=data.rooms[String(room)];
  const dims=room===0?[546,483]:[589,482];
  if(!spec||spec.roomId!==room||spec.opens_at_level!==room+1||
     JSON.stringify(spec.size)!==JSON.stringify(dims)||
     !spec.cumulative||!spec.increments||!Array.isArray(spec.fixture_ids)||
     spec.fixture_ids.length!==(room===0?3:5))
   throw Error('E_P5_ROOM_SCHEMA '+room);
  for(let level=1;level<=6;level++){
   const path=assetPath(spec.cumulative[String(level)]);
   const a=listed.get(path);
   if(!a||a.roomId!==room||a.kind!=='cumulative'||a.level!==level||JSON.stringify(a.size)!==JSON.stringify(dims))
    throw Error('E_P5_CUMULATIVE_MISSING '+room+'/'+level);
   paths.push([path,dims]);
   if(level>1){
    const increment=assetPath(spec.increments[String(level)]);
    const d=listed.get(increment);
    if(!d||d.roomId!==room||d.kind!=='increment'||d.level!==level||JSON.stringify(d.size)!==JSON.stringify(dims))
     throw Error('E_P5_INCREMENT_MISSING '+room+'/'+level);
   }
  }
 }
 if(listed.size!==66||paths.length!==36)throw Error('E_P5_MANIFEST_COUNT');
 return paths;
}
async function init(){
 if(ready)return;
 const res=await fetch(MANIFEST,{cache:'no-store'});
 if(!res.ok)throw Error('E_P5_MANIFEST_FETCH '+res.status);
 const data=await res.json();
 const paths=validate(data);
 for(const [path,[width,height]] of paths){
  const im=await new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>resolve(img);
   img.onerror=()=>reject(Error('E_P5_ASSET_LOAD '+path));img.src=path;
  });
  if(im.naturalWidth!==width||im.naturalHeight!==height)throw Error('E_P5_ASSET_DIMENSION '+path);
  images.set(path,im);
 }
 manifest=data;ready=true;
}
function resolve(room,progression){
 const level=levelOf(progression);
 if(!Number.isInteger(room)||room<0||room>5)throw Error('E_P5_ROOM_INVALID');
 if(!ready)throw Error('E_P5_NOT_READY');
 const spec=manifest.rooms[String(room)];
 if(!spec||spec.opens_at_level!==room+1)throw Error('E_P5_ROOM_SCHEMA '+room);
 if(room>=level)return null;
 const path=assetPath(spec.cumulative[String(level)]);
 if(!images.has(path))throw Error('E_P5_ASSET_MISSING '+path);
 return path;
}
function paint(ctx,room,progression){
 const path=resolve(room,progression);
 if(path===null)return false;
 if(!ctx||typeof ctx.drawImage!=='function')throw Error('E_P5_CANVAS_INVALID');
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 // Full-room native coordinates. Caller owns camera scaling and translation.
 ctx.drawImage(images.get(path),0,0);
 ctx.restore();
 return true;
}
window.A18P5Decorations={init,paint,resolve,ready:()=>ready,assetCount:()=>images.size,mode:'cumulative',roomNames};
})();
