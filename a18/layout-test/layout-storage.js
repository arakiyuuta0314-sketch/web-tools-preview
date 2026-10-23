/* A18 Web prototype durable state: IndexedDB stores original image Blobs. */
(()=>{'use strict';
const DATABASE='a18-museum-layout-v2',VERSION=1;
let databasePromise=null,writeChain=Promise.resolve();
function db(){
 if(databasePromise)return databasePromise;
 databasePromise=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('このブラウザでは作品の永続保存に対応していません'));return}
  const req=indexedDB.open(DATABASE,VERSION);
  req.onupgradeneeded=()=>{const store=req.result;if(!store.objectStoreNames.contains('states'))store.createObjectStore('states')};
  req.onerror=()=>reject(req.error||Error('IndexedDBを開けませんでした'));
  req.onblocked=()=>reject(Error('保存データベースがほかのタブで使用されています'));
  req.onsuccess=()=>resolve(req.result);
 });
 return databasePromise;
}
async function load(){
 const database=await db();
 return new Promise((resolve,reject)=>{
  const tx=database.transaction('states','readonly');
  const r=tx.objectStore('states').get('museum');
  r.onsuccess=()=>resolve(r.result||null);
  r.onerror=()=>reject(r.error||Error('保存状態の読み込みに失敗しました'));
 });
}
function serializable(data){
 const result={schemaVersion:2,fixtures:data.fixtures,avatarGender:data.avatarGender,playerName:data.playerName||'',museumTitle:data.museumTitle,
  galleryIndex:data.galleryIndex,pos:data.pos,carrying:data.carrying,works:data.works.map(w=>({
   id:w.id,title:w.title,complete:w.complete,registered:w.registered,pieces:w.pieces,preferredShape:w.preferredShape||null,
   notes:w.notes,fixtureId:w.fixtureId,thumbnail:w.thumbnail,
   originalBlob:w.originalBlob||null,
   displaySrc:w.displaySrc===w.originalURL?null:w.displaySrc||null
  }))};
 if(result.works.some(w=>!w.originalBlob))throw Error('保存できない原本画像があります。原本を確認してください');
 return result;
}
async function rawSave(state){
 const database=await db();
 return new Promise((resolve,reject)=>{
  const tx=database.transaction('states','readwrite');
  tx.oncomplete=()=>resolve(true);
  tx.onerror=()=>reject(tx.error||Error('保存に失敗しました'));
  tx.onabort=()=>reject(tx.error||Error('保存が中断されました'));
  tx.objectStore('states').put(state,'museum');
 });
}
function save(data){
 // Snapshot immediately: later UI changes must not mutate a queued IDB transaction.
 const snapshot=serializable(data);
 writeChain=writeChain.catch(()=>{}).then(()=>rawSave(snapshot));
 return writeChain;
}
function restoreWorks(records){
 return records.map(w=>{
  if(!w.originalBlob || !(w.originalBlob instanceof Blob))throw Error('作品「'+w.id+'」の原本画像が保存されていません');
  const originalURL=URL.createObjectURL(w.originalBlob);
  return {...w,originalURL,displaySrc:w.displaySrc||originalURL};
 });
}
window.A18Storage={load,save,restoreWorks,serializable};
})();
