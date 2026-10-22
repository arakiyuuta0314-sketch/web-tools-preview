/* A18 room decoration UI. No production artwork is mutated. */
(()=>{'use strict';
const L=()=>window.A18Layout;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let api=null,root=null,draft=null,origin=null,room=null,selected=null,history=[],future=[],drag=null,pointers=new Map();
let zoom=1,offsetX=0,offsetY=0,canvas=null,context=null,resizeObserver=null;
const MODE_LABELS={contain:'全体表示',cover:'枠いっぱい',custom:'自由調整'};
const SHAPE_LABELS={landscape:'横型',portrait:'縦型',square:'正方形'};
const ROOM_NAMES=['エントランス','第2展示室','第3展示室','第4展示室','第5展示室','第6展示室'];
const fullData=()=>draft;
const workFor=f=>api.works().find(w=>w.fixtureId===f.id);
const text=(id,value)=>{const e=$(id);if(e)e.textContent=value};
function mount(options){
 if(root)close(true);
 api=options;origin=L().clone(api.fixtures());draft=L().clone(origin);room=null;selected=null;
 root=document.createElement('section');root.id='a18LayoutEditor';root.className='a18-edit-shell';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 document.body.appendChild(root);renderMap();
}
function close(force=false){
 if(!root)return;
 if(!force && JSON.stringify(draft)!==JSON.stringify(origin) && !confirm('保存していない変更があります。破棄して模様替えを終了しますか？'))return;
 if(resizeObserver)resizeObserver.disconnect();resizeObserver=null;
 root.remove();root=null;room=null;pointers.clear();api?.onClose?.();api=null;
}
const controls='<div class="a18-edit-actions"><button id="a18OpenCatalog">＋ 家具を置く</button><button id="a18Undo">↶ 戻す</button><button id="a18Redo">↷ やり直す</button><button id="a18Discard">破棄</button><button id="a18Back" hidden>全館マップへ</button></div>';
function renderMap(){
 if(resizeObserver)resizeObserver.disconnect();resizeObserver=null;room=null;selected=null;
 const cards=[3,5,4,1,0,2].map(index=>'<button class="a18-room-map-item r'+(index+1)+'" data-room="'+index+'"><span>'+ROOM_NAMES[index]+'</span><small>額縁 '+L().roomFrames(draft,index).length+'枠</small></button>').join('');
 root.innerHTML='<header><strong>爺やの模様替え帳</strong><button id="a18EditorExit">模様替えを終了</button></header>'+
  '<p class="a18-map-help">編集したいお部屋を選んでください。全6室の配置を変更できます。</p>'+
  '<div class="a18-room-map">'+cards+'</div><p class="a18-map-help">お部屋を選ぶと、上から見た編集画面になります。</p>';
 $('a18EditorExit').onclick=()=>close();
 root.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>renderRoom(Number(b.dataset.room)));
}
function renderRoom(target){
 room=target;selected=null;history=[];future=[];pointers.clear();
 root.innerHTML='<header><button id="a18MapHeader" class="a18-nav-back">‹ 部屋一覧</button><strong>'+ROOM_NAMES[room]+'</strong><button id="a18Save" class="primary">保存</button></header>'+
 '<div class="a18-edit-main"><div class="a18-edit-stage"><canvas id="a18EditCanvas" aria-label="額縁や家具をドラッグして配置"></canvas>'+
 '<p class="a18-edit-tip">指でつかんで動かす　・　2本指で拡大</p></div>'+
 '<div class="a18-edit-panel">'+
 '<div class="a18-selection-bar"><strong id="a18Selected">家具や額縁をタップして動かせます</strong><button id="a18Details" hidden>見た目を変える</button><button id="a18RemoveDecor" hidden>片付ける</button></div>'+
 '<p id="a18EditMessage" role="status" aria-live="polite"></p>'+controls+'</div></div>'+
 '<section id="a18FramePanel" class="a18-editor-sheet" hidden aria-label="選んだ額縁の設定">'+
 '<div class="a18-sheet-title"><strong>額縁の見た目</strong><button id="a18CloseDetails">閉じる ×</button></div>'+
 '<div class="a18-frame-options">'+
 '<label>かたち<select id="a18Shape"><option value="landscape">横型</option><option value="portrait">縦型</option><option value="square">正方形</option></select></label>'+
 '<label>いろ<select id="a18Design"><option value="gold">金色</option><option value="wood">木製</option></select></label>'+
 '<label>置き方<select id="a18Installation"><option value="wall">壁掛け</option><option value="floor">床置き</option></select></label></div>'+
 '<div id="a18ShapeRecommendation"><span id="a18ShapeHint"></span><button id="a18SuggestShape">おすすめの形に</button></div>'+
 '<details id="a18PhotoSection"><summary>写真の表示を調整</summary><div class="a18-photo-body">'+
 '<label>表示方法<select id="a18ImageMode"><option value="contain">写真全体</option><option value="cover">枠いっぱい</option><option value="custom">自由調整</option></select></label>'+
 '<div id="a18PhotoSettings"><label>拡大 <output id="a18ZoomText"></output><input id="a18PhotoZoom" type="range" min="1" max="3" step=".05"></label>'+
 '<label>左右 <input id="a18PhotoX" type="range" min="-1" max="1" step=".05"></label>'+
 '<label>上下 <input id="a18PhotoY" type="range" min="-1" max="1" step=".05"></label></div></div></details>'+
 '</section>'+
 '<section id="a18Catalog" class="a18-editor-sheet" hidden aria-label="家具・装飾を選択">'+
 '<div class="a18-sheet-title"><strong>何を置く？</strong><button id="a18CloseCatalog">閉じる ×</button></div>'+
 '<div class="a18-catalog-tabs" id="a18CatalogTabs">'+
 '<button data-category="furniture" class="active">家具</button><button data-category="decor">飾り</button><button data-category="display">展示</button></div>'+
 '<div id="a18CatalogItems" class="a18-catalog-grid"></div>'+
 '<div class="a18-legacy-add" hidden><select id="a18NewType">'+Object.keys(L().TYPES).map(k=>'<option value="'+k+'">'+L().LABELS[k]+'</option>').join('')+'</select><button id="a18AddDecor">追加</button></div></section>';
 canvas=$('a18EditCanvas');context=canvas.getContext('2d');
 const stage=canvas.parentElement;resizeObserver=new ResizeObserver(()=>resetViewport());resizeObserver.observe(stage);
 resetViewport();
 $('a18MapHeader').onclick=()=>backToMap();
 $('a18Back').onclick=()=>backToMap();
 $('a18Save').onclick=save;
 $('a18Discard').onclick=()=>{if(confirm('この部屋の未保存変更を破棄しますか？')){draft=L().clone(origin);renderMap()}};
 $('a18Undo').onclick=undo;$('a18Redo').onclick=redo;
 $('a18AddDecor').onclick=addDecor;
 $('a18OpenCatalog').onclick=()=>{closeSheets();$('a18Catalog').hidden=false;renderCatalog('furniture')};
 $('a18CloseCatalog').onclick=()=>{$('a18Catalog').hidden=true;};
 $('a18Details').onclick=()=>{closeSheets();$('a18FramePanel').hidden=false;};
 $('a18CloseDetails').onclick=()=>{$('a18FramePanel').hidden=true;};
 root.querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>renderCatalog(button.dataset.category));
 $('a18RemoveDecor').onclick=removeDecor;
 $('a18SuggestShape').onclick=()=>{const work=workFor(chosen());if(work?.preferredShape)updateSelection('shape',work.preferredShape)};
 for(const [id,key]of [['a18Shape','shape'],['a18Design','design'],['a18Installation','installation'],['a18ImageMode','imageMode']]){
  $(id).onchange=()=>updateSelection(key,$(id).value);
 }
 for(const [id,key]of [['a18PhotoZoom','imageScale'],['a18PhotoX','imageX'],['a18PhotoY','imageY']]){
  $(id).onchange=()=>updateSelection(key,Number($(id).value));
  $(id).oninput=()=>{text('a18ZoomText',Math.round(Number($('a18PhotoZoom').value)*100)+'%');};
 }
 canvas.addEventListener('pointerdown',down);
 canvas.addEventListener('pointermove',move);
 canvas.addEventListener('pointerup',up);
 canvas.addEventListener('pointercancel',up);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.4,Math.min(3,zoom*(e.deltaY<0?1.08:.92)));paint()},{passive:false});
 renderProperties();paint();
}
function backToMap(){
 if(JSON.stringify(draft)!==JSON.stringify(origin)){
  const answer=confirm('保存していない変更があります。破棄して全館マップに戻りますか？');
  if(!answer)return;
  draft=L().clone(origin);
 }
 renderMap();
}
function resetViewport(){
 if(!canvas)return;
 const b=canvas.parentElement.getBoundingClientRect(),m=L().ROOM_SIZE[room],dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.max(1,Math.floor(b.width*dpr));canvas.height=Math.max(1,Math.floor((b.height-35)*dpr));
 canvas.style.width=b.width+'px';canvas.style.height=(b.height-35)+'px';
 zoom=Math.min(canvas.clientWidth/m.w,canvas.clientHeight/m.h)*.95;
 offsetX=(canvas.clientWidth-m.w*zoom)/2;offsetY=(canvas.clientHeight-m.h*zoom)/2;paint();
}
function screenToWorld(e){
 const b=canvas.getBoundingClientRect();
 return {x:(e.clientX-b.left-offsetX)/zoom,y:(e.clientY-b.top-offsetY)/zoom};
}
function chosen(){return draft?.find(f=>f.id===selected);}
function selectAt(point){
 const candidates=draft.filter(f=>f.roomId===room).slice().reverse();
 return candidates.find(f=>{const b=L().r(f);return point.x>=b[0]-9&&point.x<=b[2]+9&&point.y>=b[1]-9&&point.y<=b[3]+9});
}
function down(e){
 e.preventDefault();canvas.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size>1){if(drag){draft=drag.from;drag=null;paint();}return;}
 const at=screenToWorld(e),found=selectAt(at);
 if(selected!==found?.id)closeSheets();
 selected=found?.id||null;renderProperties();
 drag=found?{id:found.id,startX:found.x,startY:found.y,at,from:L().clone(draft)}:null;paint();
}
function move(e){
 if(!pointers.has(e.pointerId))return;
 e.preventDefault();
 const previous=pointers.get(e.pointerId);
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){
  const others=[...pointers.values()],a=others[0],b=others[1];
  if(previous){
   const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
   offsetX+=dx/2;offsetY+=dy/2;
   // Keep moving the room canvas while both fingers are down.
   const dist=Math.hypot(a.x-b.x,a.y-b.y);
   if(Number.isFinite(lastDistance)&&lastDistance>0)zoom=Math.max(.35,Math.min(3,zoom*dist/lastDistance));
   lastDistance=dist;
  }
  paint();return;
 }
 if(!drag||!chosen())return;
 const at=screenToWorld(e),f=chosen();
 f.x=Math.round((drag.startX+at.x-drag.at.x)*10)/10;
 f.y=Math.round((drag.startY+at.y-drag.at.y)*10)/10;
 const check=L().validatePlacement(draft,room);text('a18EditMessage',check.ok?'':check.reason);
 paint();
}
let lastDistance=null;
function up(e){
 if(!pointers.has(e.pointerId))return;
 pointers.delete(e.pointerId);lastDistance=null;
 if(pointers.size>0)return;
 if(drag){
  const f=chosen(),before=drag.from;drag=null;
  if(!f)return;
  const v=L().validatePlacement(draft,room);
  if(!v.ok){draft=before;setMessage(v.reason+'。移動前に戻しました。',true);}
  else if(JSON.stringify(before)!==JSON.stringify(draft)){pushHistory(before);setMessage('配置を変更しました。保存で確定します。');}
  paint();
 }
}
function setMessage(message,bad=false){const e=$('a18EditMessage');if(e){e.textContent=message;e.classList.toggle('error',bad)}}
function pushHistory(before){history.push(before);if(history.length>60)history.shift();future=[];updateButtons();}
function updateButtons(){
 if($('a18Undo'))$('a18Undo').disabled=!history.length;
 if($('a18Redo'))$('a18Redo').disabled=!future.length;
}
function undo(){if(!history.length)return;future.push(L().clone(draft));draft=history.pop();renderProperties();paint();updateButtons()}
function redo(){if(!future.length)return;history.push(L().clone(draft));draft=future.pop();renderProperties();paint();updateButtons()}
function updateSelection(key,value){
 const f=chosen();if(!f)return;
 const before=L().clone(draft);
 if(key==='shape')L().setShape(f,value);
 else if(key==='installation'){
  f.installation=value;
  f.y=value==='wall'?Math.min(100,L().ROOM_SIZE[room].wallFoot-65):Math.max(L().ROOM_SIZE[room].wallFoot+88,280);
 }else f[key]=value;
 const v=L().validatePlacement(draft,room);
 if(!v.ok){draft=before;setMessage(v.reason+'。変更しませんでした。',true)}
 else{pushHistory(before);setMessage('変更しました。保存で確定します。');}
 renderProperties();paint();
}
function renderProperties(){
 const f=chosen(),isFrame=f?.kind==='frame';
 if(!isFrame && $('a18FramePanel'))$('a18FramePanel').hidden=true;
 if($('a18Details'))$('a18Details').hidden=!isFrame;
 text('a18Selected',f?(isFrame?'額縁を選択中':(L().LABELS[f.type]||'装飾')+'を選択中'):'家具や額縁をタップして動かせます');
 for(const id of ['a18Shape','a18Design','a18Installation','a18ImageMode'])$(id).disabled=!isFrame;
 $('a18RemoveDecor').hidden=!f||isFrame;
 $('a18PhotoSettings').hidden=!isFrame||f.imageMode!=='custom';
 const recommendation=isFrame?workFor(f)?.preferredShape:null;
 $('a18ShapeRecommendation').hidden=!recommendation;
 text('a18ShapeHint',recommendation?'写真におすすめ：'+SHAPE_LABELS[recommendation]:'');
 $('a18SuggestShape').disabled=!recommendation||f.shape===recommendation;
 if(isFrame){
  $('a18Shape').value=f.shape;$('a18Design').value=f.design==='wood'?'wood':'gold';$('a18Installation').value=f.installation;$('a18ImageMode').value=f.imageMode;
  $('a18PhotoZoom').value=f.imageScale||1;$('a18PhotoX').value=f.imageX||0;$('a18PhotoY').value=f.imageY||0;
  text('a18ZoomText',Math.round((f.imageScale||1)*100)+'%');
 }
 updateButtons();
}
function closeSheets(){
 if($('a18Catalog'))$('a18Catalog').hidden=true;
 if($('a18FramePanel'))$('a18FramePanel').hidden=true;
}
const categories={
 furniture:['sofa','bench','table','stool','cabinet','rug'],
 decor:['plant','vase','lamp','rope','clock','sign','column','tapestry'],
 display:['pedestal','pedestalSquare','statue','easel']
};
function renderCatalog(category){
 root.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',b.dataset.category===category));
 const target=$('a18CatalogItems');
 target.innerHTML=categories[category].map(type=>{
  const item=window.A18Art?.manifest?.decor?.[type];
  const source=item?.path||'';
  return '<button class="a18-catalog-item" data-new-type="'+type+'"><img src="'+esc(source)+'" alt=""><span>'+esc(L().LABELS[type])+'</span></button>';
 }).join('');
 target.querySelectorAll('[data-new-type]').forEach(b=>b.onclick=()=>{
  $('a18NewType').value=b.dataset.newType;
  addDecor();
  if(chosen()&&chosen().type===b.dataset.newType)$('a18Catalog').hidden=true;
 });
}
function addDecor(){
 const type=$('a18NewType').value,before=L().clone(draft);
 const m=L().ROOM_SIZE[room],f=L().newDecor(room,type,m.w/2,m.wallFoot+95);
 // Seek an actually valid free position, without assuming a fixed grid layout.
 let found=false;
 const yStart=f.installation==='wall'?m.wallFoot-f.height/2-8:m.wallFoot+70;
 const yEnd=f.installation==='wall'?65:m.h-78;
 for(let y=yStart;f.installation==='wall'?y>yEnd&&!found:y<yEnd&&!found;y+=f.installation==='wall'?-10:10){
  for(let x=68;x<m.w-67;x+=10){
   f.x=x;f.y=y;draft.push(f);
   if(L().validatePlacement(draft,room).ok){found=true;break;}
   draft.pop();
  }
 }
 if(!found){draft=before;setMessage('この部屋には配置可能な空きスペースが見つかりません。',true);return;}
 selected=f.id;pushHistory(before);renderProperties();paint();setMessage(L().LABELS[type]+'を追加しました。保存で確定します。');
}
function removeDecor(){
 const f=chosen();if(!f||f.kind==='frame')return;
 const before=L().clone(draft);draft=draft.filter(x=>x.id!==f.id);selected=null;
 pushHistory(before);renderProperties();paint();setMessage('装飾を撤去しました。保存で確定します。');
}
function save(){
 const checked=L().validatePlacement(draft,room);
 if(!checked.ok){setMessage(checked.reason+'。保存できません。',true);return}
 try{
  L().syncWorks(draft,api.works());
  api.onCommit(L().clone(draft));
  origin=L().clone(draft);closeSheets();renderMap();
 }catch(e){setMessage('保存できません：'+e.message,true)}
}
const imageCache=new Map();
function imageFor(work){
 if(!work)return null;
 const src=work.displaySrc||work.originalURL;
 if(!src)return null;
 let v=imageCache.get(work.id);
 if(!v||v.src!==src){
  const img=new Image();img.src=src;v={src,img};imageCache.set(work.id,v);img.onload=()=>{if(canvas)paint()};
 }
 return v.img.complete&&v.img.naturalWidth?v.img:null;
}
function drawArt(f,b){
 const w=workFor(f),img=imageFor(w),mode=f.imageMode||'cover';
 const [x,y,x2,y2]=b,iw=x2-x,ih=y2-y;
 context.save();context.beginPath();context.rect(x+3,y+3,iw-6,ih-6);context.clip();
 context.fillStyle='#e4d9c4';context.fillRect(x+3,y+3,iw-6,ih-6);
 if(img){
  const sw=img.naturalWidth,sh=img.naturalHeight;
  const fit=mode==='contain'?Math.min((iw-7)/sw,(ih-7)/sh):Math.max((iw-7)/sw,(ih-7)/sh);
  const scale=fit*(mode==='custom'?(f.imageScale||1):1);
  const dw=sw*scale,dh=sh*scale;
  const ox=mode==='custom'?(iw-dw)*(f.imageX||0)/2:0;
  const oy=mode==='custom'?(ih-dh)*(f.imageY||0)/2:0;
  context.drawImage(img,x+iw/2-dw/2+ox,y+ih/2-dh/2+oy,dw,dh);
 }else if(!w){
  context.fillStyle='#8f7957';context.font='bold 22px serif';context.textAlign='center';context.fillText('+',f.x,f.y+8);
 }
 context.restore();
}
function paint(){
 if(!canvas||room==null||!context)return;
 const dpr=canvas.width/canvas.clientWidth,m=L().ROOM_SIZE[room],wall=m.wallFoot;
 context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
 context.fillStyle='#223d32';context.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
 context.setTransform(dpr*zoom,0,0,dpr*zoom,dpr*offsetX,dpr*offsetY);
 context.fillStyle='#e1d5bc';context.fillRect(0,0,m.w,m.h);
 context.fillStyle='#bbaa8b';context.fillRect(20,20,m.w-40,wall-28);
 context.fillStyle='#f2e8d5';context.fillRect(20,wall,m.w-40,m.h-wall-18);
 context.strokeStyle='#c6b99e';context.lineWidth=.7;
 for(let x=22;x<m.w-21;x+=42){context.beginPath();context.moveTo(x,wall);context.lineTo(x,m.h-18);context.stroke()}
 for(let y=wall;y<m.h-18;y+=42){context.beginPath();context.moveTo(22,y);context.lineTo(m.w-21,y);context.stroke()}
 for(const [edge,[x,y]] of Object.entries(L().PORTALS[room])){
  context.fillStyle='#41644e';context.fillRect(x-25,y-17,50,34);
  context.fillStyle='#fff9e2';context.font='bold 13px sans-serif';context.textAlign='center';context.fillText(edge==='north'?'▲':edge==='south'?'▼':edge==='west'?'◀':'▶',x,y+5);
 }
 window.A18Art.npc(context,'staff',room===0?257:297,room===0?353:232);
 if(room===0)window.A18Art.npc(context,'butler',155,334);
 for(const f of draft.filter(f=>f.roomId===room)){
  const b=L().r(f),[x,y,x2,y2]=b,w=x2-x,h=y2-y;
  if(f.kind==='frame'){
   window.A18Art.frame(context,f,imageFor(workFor(f)));
  }else if(!window.A18Art.decoration(context,f)){
   context.fillStyle='#83917e';context.fillRect(x,y,w,h);
  }
  if(selected===f.id){
   context.strokeStyle=L().validatePlacement(draft,room).ok?'#17734c':'#d43f35';
   context.lineWidth=3;context.setLineDash([8,4]);context.strokeRect(x-12,y-12,w+24,h+24);context.setLineDash([]);
  }
 }
}
window.A18LayoutEditor={open:mount,close,isOpen:()=>Boolean(root)};
})();
