/* A18 museum layout v2: fixture IDs, continuous world coordinates, and validation. */
(()=>{'use strict';
const SHAPES={landscape:[100,76],portrait:[70,104],square:[88,88]};
const BASE=[
 [[40,58,140,135],[216,58,316,135],[404,58,504,135]],
 [[42,58,140,134],[208,58,306,134],[418,58,516,134],[56,251,154,327],[405,251,503,327]],
 [[63,63,192,155],[217,63,317,139],[431,66,531,142],[62,235,154,309],[417,261,512,335]],
 [[37,75,134,153],[147,58,240,137],[256,55,326,135],[424,75,526,153],[60,261,166,335]],
 [[77,56,207,154],[407,56,534,154],[56,244,153,319],[177,244,264,319],[412,262,512,336]],
 [[39,63,151,153],[215,48,320,147],[418,63,537,153],[66,257,179,338],[403,239,516,316]]
];
const ROOM_SIZE=Array.from({length:6},(_,i)=>({w:i===0?546:589,h:i===0?483:482,wallFoot:i===0?202:164}));
const ROOM_LINKS={0:{west:1,east:2,north:5},1:{east:0,north:3},2:{west:0,north:4},3:{south:1,east:5},4:{south:2,west:5},5:{south:0,west:3,east:4}};
const PORTALS={
 0:{west:[70,388],east:[476,388],north:[367,220]},
 1:{east:[513,388],north:[367,183]},2:{west:[76,388],north:[367,183]},
 3:{south:[296,420],east:[513,388]},4:{south:[296,420],west:[76,388]},
 5:{south:[296,420],west:[76,388],east:[513,388]}
};
// Fixed staffing locations: floor-side, clear of display frames and door corridors.
const STAFF_POSITIONS={
 1:{x:225,y:349},2:{x:248,y:349},3:{x:232,y:357},
 4:{x:345,y:349},5:{x:253,y:352}
};
const BUTLER={x:155,footY:334};
// Exact approved source alpha bounds are staff (8,6)-(51,72),
// butler (8,4)-(51,72) on a 60x77 sprite, drawn at 43x55.
const NPC_SPRITES={staff:{alpha:[8,6,51,72],canvas:[60,77],size:[43,55]},
 butler:{alpha:[8,4,51,72],canvas:[60,77],size:[43,55]}};
function npcBounds(role,room){
 const sprite=NPC_SPRITES[role];
 if(!sprite)throw Error('不明なNPC：'+role);
 const p=role==='butler'?BUTLER:STAFF_POSITIONS[room];
 if(!p)throw Error('この部屋にNPCはいません：'+room);
 const [sw,sh]=sprite.canvas,[dw,dh]=sprite.size,[l,t,rr,bb]=sprite.alpha;
 const footY=role==='butler'?p.footY:p.y+20;
 const originX=p.x-dw/2,originY=footY-dh*(72/sh);
 const rect=[originX+l*dw/sw,originX+rr*dw/sw,
   originY+t*dh/sh,originY+bb*dh/sh];
 return rect; // [left, right, top, bottom]: identical to gameplay collision format
}
const staffBlock=room=>npcBounds('staff',room);
function npcAnchor(role,room){
 const b=npcBounds(role,room);
 return {x:(b[0]+b[1])/2,y:(b[2]+b[3])/2};
}
const TYPES={sofa:[84,44],bench:[84,35],table:[62,55],plant:[35,35],vase:[28,45],lamp:[30,45],rug:[95,48],rope:[75,60],sign:[42,55],clock:[32,75],cabinet:[75,78],pedestal:[55,96],easel:[70,91],column:[42,82],statue:[55,84],stool:[42,48],tapestry:[42,49],pedestalSquare:[55,57]};
const LABELS={sofa:'ソファ',bench:'ベンチ',table:'テーブル',plant:'観葉植物',vase:'花瓶',lamp:'照明',rug:'カーペット',rope:'ロープ柵',sign:'案内板',clock:'時計',cabinet:'キャビネット',pedestal:'丸い展示台',easel:'イーゼル',column:'石柱',statue:'胸像',stool:'スツール',tapestry:'タペストリー',pedestalSquare:'四角い展示台'};
const clone=x=>JSON.parse(JSON.stringify(x));
const r=f=>[f.x-f.width/2,f.y-f.height/2,f.x+f.width/2,f.y+f.height/2];
const overlaps=(a,b,gap=0)=>a[0]<b[2]+gap&&a[2]>b[0]-gap&&a[1]<b[3]+gap&&a[3]>b[1]-gap;
const fixtureId=(room,i)=>'frame-'+room+'-'+i;
const slotFor=(room,i)=>room===0?i:5+(room-1)*5+i;
const legacyId=slot=>{
 if(!Number.isInteger(slot))throw Error('旧展示番号が整数ではありません');
 for(let room=0;room<6;room++)for(let i=0;i<BASE[room].length;i++)if(slotFor(room,i)===slot)return fixtureId(room,i);
 throw Error('未定義の旧展示位置: '+slot);
};
// Restore the v1.8 physical size only for untouched frames auto-expanded by v2.2.
// Preserve deliberate user changes and all work/fixture associations.
function restoreClassicFrameDimensions(fixtures){
 let reverted=0;
 for(const f of fixtures.filter(x=>x.kind==='frame')){
  if(f.sizingVersion===3)continue;
  const r=BASE[f.roomId]?.[Number(f.id.split('-')[2])];
  if(!r)throw Error('展示設備IDと部屋の基準が一致しません: '+f.id);
  const [x1,y1,x2,y2]=r,ow=x2-x1,oh=y2-y1;
  const auto=(Math.abs(f.x-(x1+x2)/2)<.001&&Math.abs(f.y-(y1+y2)/2)<.001&&
   Math.abs(f.width-Math.round(ow*1.17*10)/10)<.001&&
   Math.abs(f.height-Math.round(oh*1.085*10)/10)<.001&&f.shape==='landscape');
  if(auto){f.width=ow;f.height=oh;reverted++;}
  f.sizingVersion=3;
 }
 return reverted;
}
function defaults(){
 const result=[];
 BASE.forEach((rs,room)=>rs.forEach(([x1,y1,x2,y2],index)=>{
  result.push({id:fixtureId(room,index),roomId:room,kind:'frame',
   x:(x1+x2)/2,y:(y1+y2)/2,width:x2-x1,height:y2-y1,
   installation:y1>=220?'floor':'wall',shape:'landscape',design:'gold',
   imageMode:'cover',imageScale:1,imageX:0,imageY:0,workId:null,
   assetKey:null,legacySlot:slotFor(room,index)});
 }));
 return result;
}
// The exhibition floor plan is now curated, not user-editable. Preserve
// IDs, photo associations, original works and any legacy decoration records.
function enforceFixedLayout(fixtures){
 let corrected=0;
 for(const f of fixtures.filter(f=>f.kind==='frame')){
  const r=BASE[f.roomId]?.[Number(f.id.split('-')[2])];
  if(!r)throw Error('固定展示位置の定義がありません：'+f.id);
  const [x1,y1,x2,y2]=r,next={
   x:(x1+x2)/2,y:(y1+y2)/2,width:x2-x1,height:y2-y1,
   installation:y1>=220?'floor':'wall'
  };
  if(Object.entries(next).some(([k,v])=>f[k]!==v)){
   Object.assign(f,next);corrected++;
  }
  f.sizingVersion=3;
 }
 return corrected;
}
const frameOf=(fixtures,room,index)=>fixtures.find(f=>f.id===fixtureId(room,index));
const roomFrames=(fixtures,room)=>BASE[room].map((_,i)=>{const f=frameOf(fixtures,room,i);if(!f)throw Error('展示枠欠損 '+room+':'+i);return f;});
function assertData(fixtures,works){
 if(!Array.isArray(fixtures)||!Array.isArray(works))throw Error('設備と作品は配列で保存してください');
 const ids=new Set(),uses=new Set();
 for(const f of fixtures){
  if(!f.id||ids.has(f.id))throw Error('設備IDが欠損または重複: '+f.id);
  ids.add(f.id);
  if(!Number.isInteger(f.roomId)||f.roomId<0||f.roomId>5)throw Error('不正な部屋ID: '+f.id);
  if(!['frame','decor'].includes(f.kind))throw Error('設備種類が不正: '+f.id);
  if(!['wall','floor'].includes(f.installation))throw Error('設備設置方法が不正: '+f.id);
  if(f.kind==='frame'&&(!['landscape','portrait','square'].includes(f.shape)||!['cover','contain','custom'].includes(f.imageMode)||!['gold','wood','classic'].includes(f.design)))throw Error('額縁設定が不正: '+f.id);
  for(const k of ['x','y','width','height'])if(!Number.isFinite(f[k])||f[k]<=0)throw Error('設備寸法が不正: '+f.id+' '+k);
 }
 for(let room=0;room<6;room++)roomFrames(fixtures,room);
 const workIds=new Set();
 for(const w of works){
  if(!w.id||workIds.has(w.id))throw Error('作品IDが欠損または重複: '+w.id);
  workIds.add(w.id);
  if(w.fixtureId!=null){
   if(!ids.has(w.fixtureId)||uses.has(w.fixtureId))throw Error('作品の展示設備が不正または重複: '+w.id);
   if(fixtures.find(f=>f.id===w.fixtureId)?.kind!=='frame')throw Error('作品を置けない設備: '+w.fixtureId);
   uses.add(w.fixtureId);
  }
 }
 for(const f of fixtures){
  const actual=works.find(w=>w.fixtureId===f.id)?.id||null;
  if((f.workId||null)!==actual)throw Error('設備と作品の紐付けが不一致: '+f.id);
 }
 return true;
}
function syncWorks(fixtures,works){
 const ids=new Set(works.map(w=>w.id));
 if(ids.size!==works.length)throw Error('作品ID重複');
 for(const f of fixtures){f.workId=null;}
 for(const w of works)if(w.fixtureId!=null){
  const f=fixtures.find(f=>f.id===w.fixtureId);
  if(!f||f.kind!=='frame'||f.workId)throw Error('展示関連付けが不正: '+w.id);
  f.workId=w.id;
 }
 assertData(fixtures,works);
}
function migrateLegacy(works){
 for(const w of works)if(Object.hasOwn(w,'spot')){
  if(Object.hasOwn(w,'fixtureId'))throw Error('旧/新展示キーが混在: '+w.id);
  w.fixtureId=w.spot==null?null:legacyId(w.spot);
  delete w.spot;
 }
}
function obstacles(fixtures,room){
 const result=room===0?[npcBounds('butler',room)]:[staffBlock(room)];
 for(const f of fixtures)if(f.roomId===room&&f.kind==='frame'&&f.installation==='floor'){
  const [l,t,rr,b]=r(f);
  result.push([l-10,rr+10,t-12,b+10]);
 }
 return result;
}
function walkable(x,y,fixtures,room){
 const m=ROOM_SIZE[room],radius=9,fy=y+5;
 if(x<24||x>m.w-24||y<101||y>m.h-11)return false;
 if(y<m.wallFoot && (ROOM_LINKS[room].north==null||x<349||x>382))return false;
 for(const [l,rr,t,b] of obstacles(fixtures,room)){
  const cx=Math.max(l,Math.min(x,rr)),cy=Math.max(t,Math.min(fy,b));
  if(Math.hypot(x-cx,fy-cy)<radius)return false;
 }
 return true;
}
function anchor(f,room){
 if(f.kind!=='frame')return null;
 return {x:f.x,y:f.installation==='wall'?ROOM_SIZE[room].wallFoot+18:f.y+f.height/2+29};
}
function validatePlacement(fixtures,room){
 try{assertData(fixtures,[]);}catch(e){
 // assertData without works is only valid if all workId are empty; structural checks below instead.
 if(!String(e.message).includes('紐付け'))return {ok:false,reason:e.message};
 }
 const m=ROOM_SIZE[room],rs=fixtures.filter(f=>f.roomId===room&&f.kind==='frame');
 for(const f of rs){
  const b=r(f);
  if(f.installation==='wall'){
   if(f.kind!=='frame'&&f.type!=='tapestry')return {ok:false,reason:'壁掛けできない装飾です'};
   if(b[0]<30||b[2]>m.w-30||b[1]<35||b[3]>m.wallFoot-4)return {ok:false,reason:'額縁が壁面の配置可能範囲を超えています'};
   if(ROOM_LINKS[room].north!=null && overlaps(b,[340,70,397,m.wallFoot],4))return {ok:false,reason:'北側の扉を塞いでいます'};
  }else if(f.installation==='floor'){
   if(b[0]<32||b[2]>m.w-32||b[1]<m.wallFoot+18||b[3]>m.h-62)return {ok:false,reason:'床の配置可能範囲を超えています'};
  }else return {ok:false,reason:'不明な設置方式'};
  for(const other of rs){
   if(other===f||other.installation!==f.installation||f.type==='rug'||other.type==='rug')continue;
   if(overlaps(b,r(other),f.type==='rug'||other.type==='rug'?0:6))
    return {ok:false,reason:'別の設備と重なっています'};
  }
  if(f.installation==='floor'){
   const nb=room===0?npcBounds('butler',room):staffBlock(room);
   const staticBlocks=[[nb[0],nb[2],nb[1],nb[3]]];
   if(staticBlocks.some(s=>overlaps(b,s,10)))return {ok:false,reason:'スタッフや爺やの位置を塞いでいます'};
   for(const [x,y] of Object.values(PORTALS[room])){
    if(overlaps(b,[x-31,y-36,x+31,y+36],4))return {ok:false,reason:'部屋の出入口を塞いでいます'};
   }
  }
 }
 // Route validation: every portal, staff and artwork viewing anchor must share a walkable component.
 const step=12,key=(ix,iy)=>ix+','+iy;
 const reachable=new Set(),queue=[];
 const seed=[m.w/2,410];
 const sx=Math.round(seed[0]/step),sy=Math.round(seed[1]/step);
 const tryAdd=(ix,iy)=>{
  const k=key(ix,iy);if(reachable.has(k))return;
  if(!walkable(ix*step,iy*step,fixtures,room))return;
  reachable.add(k);queue.push([ix,iy]);
 };
 tryAdd(sx,sy);
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];
  tryAdd(x-1,y);tryAdd(x+1,y);tryAdd(x,y-1);tryAdd(x,y+1);
 }
 const npc=room===0?npcAnchor('butler',room):npcAnchor('staff',room);
 const points=[...Object.values(PORTALS[room]),[npc.x,npc.y],...rs.filter(f=>f.kind==='frame').map(f=>{const a=anchor(f,room);return [a.x,a.y]})];
 if(room===0)points.push([186,330]);
 for(const [px,py]of points){
  let found=false;
  for(let ix=Math.floor((px-40)/step);ix<=Math.ceil((px+40)/step)&&!found;ix++){
   for(let iy=Math.floor((py-40)/step);iy<=Math.ceil((py+40)/step);iy++){
    if(Math.hypot(ix*step-px,iy*step-py)<=40&&reachable.has(key(ix,iy))){found=true;break}
   }
  }
  if(!found)return {ok:false,reason:'扉・スタッフ・鑑賞位置への通路がつながりません'};
 }
 return {ok:true,reason:''};
}
function setShape(f,shape){
 if(!SHAPES[shape])throw Error('不明な額縁の形状');
 f.shape=shape;[f.width,f.height]=SHAPES[shape];
}
function newDecor(room,type,x=120,y=300){
 if(!TYPES[type])throw Error('未定義の装飾: '+type);
 return {id:'decor-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  roomId:room,kind:'decor',type,installation:type==='tapestry'?'wall':'floor',x,y,width:TYPES[type][0],height:TYPES[type][1],
  shape:'square',design:'classic',assetKey:type,workId:null};
}
window.A18Layout={BASE,ROOM_SIZE,ROOM_LINKS,PORTALS,STAFF_POSITIONS,BUTLER,npcBounds,npcAnchor,TYPES,LABELS,defaults,fixtureId,slotFor,legacyId,clone,r,overlaps,frameOf,roomFrames,assertData,syncWorks,migrateLegacy,enforceFixedLayout,obstacles,walkable,anchor,validatePlacement,setShape,newDecor,restoreClassicFrameDimensions};
})();
