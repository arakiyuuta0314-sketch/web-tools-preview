'use strict';
(() => {
const W=930,H=582,KEY='a18-gallery1-editor-v06';
const names={wall4:'展示壁④',wall5:'展示壁⑤',counter:'案内台'},ids=Object.keys(names);
const START={wall4:{x:132,y:328,w:240,h:182},wall5:{x:628,y:286,w:240,h:182},counter:{x:425,y:396,w:175,h:96}};
const $=id=>document.getElementById(id);
const cp=ob=>Object.fromEntries(ids.map(id=>[id,{...ob[id]}]));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let objects=cp(START),selected='wall4',zoom=.8,mode='edit',history=[],future=[],drag=null;
function validate(o){
 const a=o.objects||o,ret={};
 for(const id of ids){
  const obj=a[id],base=START[id];
  if(!obj||!Number.isFinite(Number(obj.x))||!Number.isFinite(Number(obj.y)))throw Error(id+' の座標がありません');
  if(('w' in obj&&Number(obj.w)!==base.w)||('h' in obj&&Number(obj.h)!==base.h))throw Error(id+' の寸法が違います');
  ret[id]={...base,x:Math.round(Number(obj.x)),y:Math.round(Number(obj.y))};
 }
 return ret;
}
try{const saved=localStorage.getItem(KEY);if(saved)objects=validate(JSON.parse(saved));}catch(_){}
const data=()=>({schema:'a18-gallery-layout-preview/v1',roomId:1,canvas:{width:W,height:H},
 exitNorth:'展示室3',entranceEast:'エントランス',objects:cp(objects)});
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(objects));}catch(_){}};
const status=s=>{$('status').textContent=s;};
const intersects=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
function render(){
 let problems=[];
 for(let i=0;i<ids.length;i++){
  const id=ids[i],o=objects[id];
  if(o.x<42||o.x+o.w>888||o.y<220||o.y+o.h>H-14)problems.push(names[id]+'が部屋の範囲を超えています');
  if(o.y<275)problems.push(names[id]+'が上側の通路に近すぎます');
  for(let j=i+1;j<ids.length;j++)if(intersects(o,objects[ids[j]]))problems.push(names[id]+'と'+names[ids[j]]+'が重なっています');
  const node=document.querySelector('[data-object="'+id+'"]');
  Object.assign(node.style,{left:o.x+'px',top:o.y+'px',width:o.w+'px',height:o.h+'px',pointerEvents:mode==='edit'?'auto':'none'});
  node.classList.toggle('selected',selected===id);
  node.setAttribute('aria-pressed',String(selected===id));
 }
 for(const id of ids){
  document.querySelector('[data-object="'+id+'"]').classList.toggle('invalid',problems.some(t=>t.includes(names[id])));
  const b=document.querySelector('[data-pick="'+id+'"]');b.setAttribute('aria-pressed',String(selected===id));b.classList.toggle('primary',selected===id);
 }
 const o=objects[selected];$('coord-x').value=o.x;$('coord-y').value=o.y;$('dims').textContent=o.w+' × '+o.h+' px';
 $('warning').textContent=problems.length?'⚠ '+problems.join('／'):'';
 $('json-preview').textContent=JSON.stringify(data(),null,2);
 $('undo').disabled=!history.length;$('redo').disabled=!future.length;
}
function commit(before,message){
 if(same(before,objects))return;
 history.push(cp(before));if(history.length>100)history.shift();future=[];
 persist();render();status(message||'配置を変更しました');
}
function select(id){if(ids.includes(id)){selected=id;render();status(names[id]+'を選択中');}}
function change(id,v){
 const old=cp(objects),o=objects[id];
 if(!Number.isFinite(Number(v.x))||!Number.isFinite(Number(v.y)))return;
 o.x=clamp(Math.round(Number(v.x)),0,W-o.w);o.y=clamp(Math.round(Number(v.y)),218,H-o.h);
 commit(old,names[id]+'の配置を更新しました');
}
function showMode(m){
 mode=m;$('edit-mode').setAttribute('aria-pressed',String(m==='edit'));$('pan-mode').setAttribute('aria-pressed',String(m==='pan'));
 render();status(m==='edit'?'編集モード：設備をドラッグできます':'鑑賞モード：横スクロールで部屋を確認できます');
}
function zoomTo(z){zoom=z;$('stage').style.transform='scale('+z+')';$('outer').style.width=(W*z)+'px';$('outer').style.height=(H*z)+'px';}
function entranceView(){const n=$('scroller');n.scrollLeft=n.scrollWidth-n.clientWidth;}
for(const node of document.querySelectorAll('[data-object]')){
 node.addEventListener('pointerdown',e=>{
  if(mode!=='edit'||!e.isPrimary)return;
  e.preventDefault();const id=node.dataset.object;select(id);
  drag={id,pid:e.pointerId,x:e.clientX,y:e.clientY,old:cp(objects)};
  node.setPointerCapture(e.pointerId);
 });
 node.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==node.dataset.object||drag.pid!==e.pointerId)return;
  const v=objects[drag.id],start=drag.old[drag.id];
  v.x=clamp(Math.round(start.x+(e.clientX-drag.x)/zoom),0,W-v.w);
  v.y=clamp(Math.round(start.y+(e.clientY-drag.y)/zoom),218,H-v.h);render();
 });
 const finish=e=>{
  if(!drag||drag.pid!==e.pointerId||drag.id!==node.dataset.object)return;
  const before=drag.old,id=drag.id;drag=null;commit(before,names[id]+'の位置を保存しました');
 };
 node.addEventListener('pointerup',finish);node.addEventListener('pointercancel',finish);
 node.addEventListener('lostpointercapture',()=>{
  if(!drag||drag.id!==node.dataset.object)return;
  const old=drag;drag=null;commit(old.old,'配置を保存しました');
 });
 node.addEventListener('click',()=>select(node.dataset.object));
}
for(const btn of document.querySelectorAll('[data-pick]'))btn.onclick=()=>select(btn.dataset.pick);
for(const btn of document.querySelectorAll('[data-move]'))btn.onclick=()=>{
 const [dx,dy]=btn.dataset.move.split(',').map(Number),o=objects[selected];
 change(selected,{x:o.x+dx,y:o.y+dy});
};
for(const ax of ['x','y'])$('coord-'+ax).addEventListener('change',e=>{
 change(selected,{...objects[selected],[ax]:Number(e.target.value)});
});
document.addEventListener('keydown',e=>{
 if(e.target.closest('input,select,textarea,button,summary'))return;
 const delta={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
 if(delta&&mode==='edit'){e.preventDefault();let p=objects[selected],n=e.shiftKey?10:1;
 change(selected,{x:p.x+delta[0]*n,y:p.y+delta[1]*n});}
});
$('edit-mode').onclick=()=>showMode('edit');$('pan-mode').onclick=()=>showMode('pan');
$('zoom').onchange=e=>zoomTo(Number(e.target.value));
$('grid-toggle').onclick=e=>{
 const v=$('checker').classList.toggle('active');e.currentTarget.setAttribute('aria-pressed',String(v));
};
$('center-view').onclick=entranceView;
$('undo').onclick=()=>{
 if(!history.length)return;future.push(cp(objects));objects=history.pop();persist();render();status('一つ前の配置に戻しました');
};
$('redo').onclick=()=>{
 if(!future.length)return;history.push(cp(objects));objects=future.pop();persist();render();status('配置をやり直しました');
};
$('reset').onclick=()=>{
 if(!confirm('設備3つを初期位置に戻しますか？'))return;
 const old=cp(objects);objects=cp(START);commit(old,'初期配置に戻しました');
};
async function copyText(t){
 try{if(!navigator.clipboard?.writeText)throw Error('clipboard');await navigator.clipboard.writeText(t);return true;}
 catch(_){const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();const result=document.execCommand('copy');a.remove();return result;}
}
$('copy').onclick=async()=>{
 try{status(await copyText(JSON.stringify(data(),null,2))?'座標JSONをコピーしました。チャットに貼り付けられます。':'コピーできません。下のJSONを選択してください。');}
 catch(_){status('コピーできません。下のJSONを選択してコピーしてください。');}
};
$('download').onclick=()=>{
 const blob=new Blob([JSON.stringify(data(),null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='a18-gallery1-layout-v06.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
 status('座標ファイルを保存しました');
};
$('show-import').onclick=()=>{$('json-text').style.display='block';$('apply-import').style.display='inline-block';};
$('apply-import').onclick=()=>{
 try{const before=cp(objects);objects=validate(JSON.parse($('json-text').value));commit(before,'JSONの配置を読み込みました');}
 catch(e){status('読み込み失敗：'+e.message);}
};
zoomTo(.8);showMode('edit');render();requestAnimationFrame(entranceView);
window.__A18_LAYOUT_EDITOR__={getState:()=>data(),select,change,reset:()=>{
 objects=cp(START);history=[];future=[];persist();render();},getWarnings:()=>$('warning').textContent};
})();
