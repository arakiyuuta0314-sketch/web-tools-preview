/* Development-only isolated v3 reset. This file must never be copied into release build. */
(()=>{
'use strict';
const KEY='museum', STORE='states', CONFIRM='全データリセット';
function assertDev(){
 if(document.querySelector('meta[name="a18-build"]')?.content!=='development')throw Error('E_RESET_NOT_AVAILABLE');
 if(!window.A18P2Store||window.A18P2Store.DATABASE!=='a18-totteoki-museum-v3')throw Error('E_DB_NAME');
}
async function resetRecord(typed,step2){
 assertDev();
 if(typed!==CONFIRM||step2!==true)throw Error('E_RESET_CONFIRMATION');
 const pre=await window.A18P2Store.load();
 if(!pre)throw Error('E_RESET_EMPTY');
 return new Promise((resolve,reject)=>{
  const q=indexedDB.open(window.A18P2Store.DATABASE,1);
  q.onerror=()=>reject(Error('E_DB_OPEN'));
  q.onblocked=()=>reject(Error('E_DB_BLOCKED'));
  q.onsuccess=()=>{
   const db=q.result,tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   let failure=null;
   store.get(KEY).onsuccess=e=>{
    if(e.target.result?.revision!==pre.revision){failure=Error('E_SAVE_CONFLICT');tx.abort();return}
    store.delete(KEY);
   };
   tx.oncomplete=()=>{db.close();resolve(true)};
   tx.onabort=()=>{db.close();reject(failure||Error('E_TX_ABORT'))};
  };
 });
}
function mount(){
 assertDev();
 const b=document.createElement('button');
 b.type='button';b.id='a18-dev-reset';
 b.textContent='開発用：全データリセット';
 b.style.cssText='position:fixed;right:10px;top:60px;z-index:99;background:#6f2935;color:white;padding:10px';
 document.body.appendChild(b);
 b.onclick=async()=>{
  if(!confirm('【開発用】作品、写真原本、メモ、館長設定、進行、物語をすべて消します。元に戻せません。続けますか？'))return;
  const phrase=prompt('確認のため「全データリセット」を入力してください');
  if(phrase!==CONFIRM){alert('確認文字列が一致しません。削除しません。');return}
  if(!confirm('最終確認：正式v3保存レコードだけを削除します。他のタブは閉じていますか？'))return;
  b.disabled=true;
  try{await resetRecord(phrase,true);alert('開発用レコードを削除しました。再読み込みでLv.1を作成します。');location.reload()}
  catch(e){alert('リセットを中止しました: '+(e.code||e.message));b.disabled=false}
 };
}
window.A18DevReset={resetRecord,mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();
