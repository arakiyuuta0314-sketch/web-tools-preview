"""Real-Chrome QA for gallery5 frame reduction and isolated QA level picker."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[3]
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
errors=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True)
  page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  url=f'http://127.0.0.1:{server.server_port}/a18/layout-test/index.html'
  page.goto(url+'?qa=1',wait_until='domcontentloaded')
  page.locator('#a18OpeningStart').click()
  page.locator('#a18OpeningSkip').click()
  page.locator('#a18PlayerName').fill('館内QA')
  page.locator('#confirmName').click()
  page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true')
  if page.locator('#skipTour').count() and page.locator('#skipTour').is_visible():
   page.locator('#skipTour').click()
  # Story popups may still be active; the QA level control is intentionally
  # inside the same in-game settings dialog, not an external debug console.
  page.wait_for_function('!window.A18Opening?.active?.()',timeout=10000) if False else None
  if page.locator('#overlay').is_visible():
   page.evaluate("document.getElementById('overlay').click()")
  page.locator('#settingsGear').click()
  page.locator('#testMuseumLevel').select_option('6')
  page.locator('#applyTestMuseumLevel').click()
  page.wait_for_function('window.__A18_SCENE_STUDY__.state().museumLevel===6')
  state=page.evaluate('window.__A18_SCENE_STUDY__.state()')
  assert len(state['fixtures'])==26,state
  assert state['roomCapacity']==3
  assert state['museumLevel']==6
  assert page.locator('#statusText').inner_text().startswith('[QA]')
  # Walk through an actual doorway via directional movement, then walk back.
  for _ in range(3):page.evaluate('window.__A18_SCENE_STUDY__.move("down")')
  for _ in range(27):
   page.evaluate('window.__A18_SCENE_STUDY__.move("left")')
   if page.evaluate('window.__A18_SCENE_STUDY__.state().galleryIndex')==1:break
  page.wait_for_function('window.__A18_SCENE_STUDY__.state().galleryIndex===1')
  for _ in range(10):
   page.evaluate('window.__A18_SCENE_STUDY__.move("right")')
   if page.evaluate('window.__A18_SCENE_STUDY__.state().galleryIndex')==0:break
  page.wait_for_function('window.__A18_SCENE_STUDY__.state().galleryIndex===0')

  for src,direction,target in [
   (0,'west',1),(1,'north',3),(3,'east',5),(5,'east',4),
   (4,'south',2),(2,'west',0),(0,'east',2),(2,'north',4),
   (4,'west',5),(5,'west',3),(3,'south',1),(1,'east',0),
   (0,'north',5),(5,'south',0)]:
   before=page.evaluate('window.__A18_SCENE_STUDY__.state().galleryIndex')
   assert before==src,(before,src,direction,target)
   success=page.evaluate('(args)=>window.__A18_SCENE_STUDY__.changeScene(args.target,{direction:args.dir})',{'target':target,'dir':direction})
   assert success,(src,direction,target)
   after=page.evaluate('window.__A18_SCENE_STUDY__.state().galleryIndex')
   assert after==target,(after,target)

  # Changing down while standing in the highest gallery returns the player
  # safely to the entrance, without creating an invalid locked-room save.
  assert page.evaluate("window.__A18_SCENE_STUDY__.changeScene(5,{direction:'north'})")
  page.locator('#settingsGear').click()
  page.locator('#testMuseumLevel').select_option('2')
  page.locator('#applyTestMuseumLevel').click()
  page.wait_for_function('window.__A18_SCENE_STUDY__.state().museumLevel===2')
  state=page.evaluate('window.__A18_SCENE_STUDY__.state()')
  assert state['galleryIndex']==0
  assert state['museumLevel']==2
  assert page.evaluate("window.A18P2Store.canTraverse(0,'north',{unlockedThroughLevel:2})")==False
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true')
  assert page.evaluate('window.__A18_SCENE_STUDY__.state().museumLevel')==2

  # This same origin's normal save key is independent of ?qa=1.
  page.goto(url,wait_until='domcontentloaded')
  page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true')
  assert page.evaluate('window.A18P2Store.TEST_MODE')==False
  assert page.evaluate('window.__A18_SCENE_STUDY__.state().museumLevel')==1
  assert page.evaluate('window.__A18_SCENE_STUDY__.state().playerName')==''
  # Inject one verified, old-format 28-frame save into this isolated browser
  # profile and prove the boot migration keeps the original photo Blob.
  page.evaluate('''async()=>{
   const P=window.A18P2Store,L=window.A18Layout,st=await P.load();
   const legacy=structuredClone(st);
   for(let i=3;i<=4;i++){
    const f=structuredClone(L.frameOf(legacy.fixtures,5,2));
    f.id='frame-5-'+i;f.legacySlot=25+i;
    f.workId=i===4?'saved-photo':null;
    legacy.fixtures.push(f);
   }
   legacy.works.push({id:'saved-photo',title:'移行する写真',notes:'メモを保持',complete:null,
    registered:'2026-10-29',pieces:null,preferredShape:'landscape',thumbnail:null,
    displaySrc:null,fixtureId:'frame-5-4',originalBlob:new Blob(['photo-bytes'],{type:'image/png'})});
   P.validate(legacy,true);
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open(P.DATABASE,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)
   });
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('states','readwrite');tx.objectStore('states').put(legacy,'museum');
    tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
   });
   db.close();
  }''')
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true')
  migrated=page.evaluate('''async()=>{const x=await window.A18P2Store.load();
   return {frames:x.fixtures.length,works:x.works.map(w=>({id:w.id,title:w.title,
   notes:w.notes,fixtureId:w.fixtureId,size:w.originalBlob.size})),revision:x.revision}}''')
  assert migrated['frames']==26,migrated
  assert migrated['works']==[{'id':'saved-photo','title':'移行する写真','notes':'メモを保持','fixtureId':None,'size':11}],migrated
  assert migrated['revision']>=1
  assert not errors,errors
  print('BROWSER PASS: real Chrome; QA Lv6->2, physical portal walks, all 14 directed portal moves, isolated saves, 28->26 Blob-preserving migration; no page errors')
  context.close()
  browser.close()
finally:
 server.shutdown()
 server.server_close()
