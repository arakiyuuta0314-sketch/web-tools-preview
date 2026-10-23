"""Production/dev staging bundle verification, independent from the game source runner."""
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import base64,subprocess,json,time,traceback,hashlib
SOURCE=Path(__file__).resolve().parents[2]
ROOT=Path(__file__).resolve().parent
RESULTS=ROOT/'results';RESULTS.mkdir(exist_ok=True)
LIB=SOURCE/'tests/p4-p2-regression-e2e.py';ns={'__file__':str(LIB)}
exec(LIB.read_text('utf-8').split('all_results=[];failure=None')[0],ns)
launch,attach=ns['launch'],ns['attach']
STAGE=Path(r'C:\Users\User\AppData\Local\Temp')
status={'tests':[],'passed':False}
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
def one(flavor,port):
 base=STAGE/('A18-v3-QA-'+flavor)
 assert base.joinpath('layout-test/index.html').is_file()
 meta=json.loads(base.joinpath('_a18_build_manifest.json').read_text('utf-8'))
 assert meta['flavor']==flavor
 if flavor=='release':
  assert not base.joinpath('layout-test/dev-reset.js').exists()
  assert not base.joinpath('layout-test/layout-storage.js').exists()
  assert not base.joinpath('layout-test/tests').exists()
 else:assert base.joinpath('layout-test/dev-reset.js').exists()
 http=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(base)))
 Thread(target=http.serve_forever,daemon=True).start()
 url=f'http://127.0.0.1:{http.server_port}/layout-test/index.html?debugReset=1&p2-e2e=1'
 try:
  with TemporaryDirectory(prefix='a18-'+flavor+'-staging-',ignore_cleanup_errors=True) as profile:
   chrome=launch(profile,port)
   try:
    w=attach(port);w.call('Page.enable');w.call('Runtime.enable')
    w.call('Emulation.setDeviceMetricsOverride',{'width':844,'height':390,'deviceScaleFactor':1,'mobile':True})
    w.call('Page.navigate',{'url':url})
    start=time.monotonic()
    while time.monotonic()-start<35:
     if w.ev("Boolean(window.__A18_SCENE_STUDY__?.ready())"):break
     time.sleep(.2)
    else:raise TimeoutError('stage-'+flavor+str(w.ev('document.getElementById("hint")?.textContent'))+str(w.console[-3:]))
    info=w.ev("({db:window.A18P2Store.DATABASE,level:window.__A18_SCENE_STUDY__.state().museumLevel,dev:typeof window.A18DevReset,button:!!document.getElementById('a18-dev-reset')})")
    assert info['db']=='a18-totteoki-museum-v3' and info['level']==1
    if flavor=='release':
     assert info['dev']=='undefined' and not info['button']
     assert w.ev("!('setFault' in window.A18P2Store) && !('testMode' in window.A18P2Store)")
     assert w.ev("document.querySelector('meta[name=a18-build]').content")=='release'
     assert w.ev("(async()=> (await fetch('layout-storage.js')).status)()")==404
    else:
     assert info['dev']=='object' and info['button']
     assert w.ev("document.querySelector('meta[name=a18-build]').content")=='development'
     # Legacy DB created exclusively inside disposable Chrome profile.
     seeded=w.ev("""(async()=>{
       const q=indexedDB.open('a18-museum-layout-v2',1);
       const db=await new Promise((resolve,reject)=>{q.onupgradeneeded=()=>q.result.createObjectStore('states');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
       await new Promise((resolve,reject)=>{const tx=db.transaction('states','readwrite');tx.objectStore('states').put({testOnly:'LEGACY-MUST-SURVIVE'},'museum');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});
       db.close();return true;
     })()""")
     assert seeded
     for typ,args in [('not-typed',"'incorrect',true"),('not-second-confirmation',"'全データリセット',false")]:
      denied=w.ev("(async()=>{try{await window.A18DevReset.resetRecord("+args+");return false}catch(e){return e.message==='E_RESET_CONFIRMATION'}})()")
      assert denied,typ
      assert w.ev("(async()=> (await window.A18P2Store.load()).revision===0)()")
     assert w.ev("(async()=>await window.A18DevReset.resetRecord('全データリセット',true))()")
     assert w.ev("(async()=>await window.A18P2Store.load()===null)()")
     preserved=w.ev("""(async()=>{
       const q=indexedDB.open('a18-museum-layout-v2',1);
       const db=await new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
       return await new Promise((resolve,reject)=>{const tx=db.transaction('states','readonly'),r=tx.objectStore('states').get('museum');r.onsuccess=()=>{const ok=r.result?.testOnly==='LEGACY-MUST-SURVIVE';db.close();resolve(ok)};r.onerror=()=>reject(r.error)});
     })()""")
     assert preserved
     w.call('Page.reload',{'ignoreCache':True})
     start=time.monotonic()
     while time.monotonic()-start<30:
      if w.ev('Boolean(window.__A18_SCENE_STUDY__?.ready())'):break
      time.sleep(.2)
     else:raise TimeoutError('dev reload did not finish')
     assert w.ev('window.__A18_SCENE_STUDY__.state().museumLevel')==1
    img=w.call('Page.captureScreenshot',{'format':'png'})['data']
    (RESULTS/('bundle_'+flavor+'_first_boot.png')).write_bytes(base64.b64decode(img))
    status['tests'].append({'flavor':flavor,'result':'PASS','boot':info,'legacyPreserved':flavor=='development'})
   finally:subprocess.run(['taskkill','/F','/T','/PID',str(chrome.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 finally:http.shutdown()
try:
 one('release',9813)
 one('development',9814)
 status['passed']=True
except Exception as e:
 status['failure']=repr(e);traceback.print_exc()
finally:
 RESULTS.joinpath('bundle_qa.json').write_text(json.dumps(status,ensure_ascii=False,indent=2),encoding='utf-8')
 print('BUNDLE QA',json.dumps(status,ensure_ascii=False),flush=True)
if not status['passed']:raise SystemExit(1)
