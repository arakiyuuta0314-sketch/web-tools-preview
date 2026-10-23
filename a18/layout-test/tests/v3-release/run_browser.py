"""A18 formal v3 source-level browser QA. Disposable Chrome profiles; no code replacement."""
from pathlib import Path
import base64,hashlib,json,subprocess,tempfile,time,traceback
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
SRC=Path(__file__).resolve().parents[2]
ROOT=Path(__file__).resolve().parent
RESULTS=ROOT/'results';RESULTS.mkdir(exist_ok=True)
LIB=SRC/'tests/p4-p2-regression-e2e.py'
ns={'__file__':str(LIB)}
exec(LIB.read_text('utf-8').split('all_results=[];failure=None')[0],ns)
launch,attach=ns['launch'],ns['attach']
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
http=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(SRC.parent)))
Thread(target=http.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{http.server_port}/layout-test/tests/v3-release/harness.html'
game=f'http://127.0.0.1:{http.server_port}/layout-test/index.html'
sha={n:hashlib.sha256((SRC/n).read_bytes()).hexdigest() for n in ['index.html','museum-p2-storage.js','layout-system.js','museum-p5-decorations.js']}
report={'source':str(SRC),'sourceSha256':sha,'runs':[],'replacedDbConstant':False,'temporaryProfilesOnly':True,'realUserDataUsed':False,'iosVerified':False}
try:
 for run in (1,2):
  with tempfile.TemporaryDirectory(prefix='a18-v3-formal-qa-',ignore_cleanup_errors=True) as profile:
   chrome=launch(profile,9800+run)
   try:
    w=attach(9800+run);w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
    w.call('Emulation.setDeviceMetricsOverride',{'width':844,'height':390,'deviceScaleFactor':1,'mobile':True})
    phases={}
    for phase in ['first','restore','full-restore']:
     w.call('Page.navigate',{'url':url+'?phase='+phase})
     start=time.monotonic()
     while time.monotonic()-start<100:
      if w.ev('Boolean(window.__A18_RESULTS__)'):break
      time.sleep(.12)
     else:raise TimeoutError(f'harness timeout {run=} {phase=}')
     result=w.ev('window.__A18_RESULTS__')
     phases[phase]=result
     print('QA',run,phase,result.get('passed'),result.get('failed'),'fatal=',str(result.get('fatal'))[:250],flush=True)
     if result.get('fatal') or result.get('failed') or result.get('passed',0)<5:
      raise AssertionError(f'harness {run} {phase}: '+json.dumps(result,ensure_ascii=False)[:1500])
    # Now open the real game using the saved 28 synthetic works and capture a true renderer screenshot.
    w.call('Page.navigate',{'url':game})
    start=time.monotonic()
    while time.monotonic()-start<15:
     if w.ev("Boolean(window.__A18_SCENE_STUDY__?.ready())"):break
     time.sleep(.2)
    else:raise TimeoutError('real game did not become ready: '+str(w.ev('document.getElementById("hint")?.textContent'))+' :: '+str(w.console[-8:])[:3200])
    scene=w.ev('window.__A18_SCENE_STUDY__.state()')
    assert scene['museumLevel']==6 and len(scene['works'])==28,('real-ui-restore',scene['museumLevel'],len(scene['works']))
    assert w.ev('window.A18P2Store.DATABASE')=='a18-totteoki-museum-v3'
    assert w.ev("document.querySelector('script[src*=layout-storage]')===null")
    assert w.ev("!('setFault' in window.A18P2Store) && !('testMode' in window.A18P2Store)")
    screen=w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']
    (RESULTS/f'run_{run}_lv6_game.png').write_bytes(base64.b64decode(screen))
    # Real game screen transitions: all 6 rooms in a contiguous valid route.
    route=[1,0,2,0,5,3,1,3,5,4,2,4,5,0]
    visited=[0];traversed=set()
    for room in route:
     succeeded=w.ev(f'(async()=>await window.__A18_SCENE_STUDY__.changeScene({room}))()')
     assert succeeded and w.ev('window.__A18_SCENE_STUDY__.state().galleryIndex')==room,('room-transition',room)
     assert w.ev(f'Boolean(window.A18P5Decorations.resolve({room},{{unlockedThroughLevel:6}}))')
     assert w.ev('window.A18P3Gallery!==undefined')
     time.sleep(.15)
     data=w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']
     (RESULTS/f'run_{run}_room_{room+1}_lv6.png').write_bytes(base64.b64decode(data))
     traversed.add((visited[-1],room));visited.append(room)
    assert set(visited)==set(range(6)) and len(traversed)==14,('7-paths-14-directions',traversed)
    # The seven story entries must be discoverable and replayable from the real settings UI.
    w.ev('window.__A18_SCENE_STUDY__.showSettings();document.getElementById("p6StoryHistory").click()')
    assert w.ev("document.querySelectorAll('[data-p6-replay]').length")==7
    data=w.call('Page.captureScreenshot',{'format':'png'})['data']
    (RESULTS/f'run_{run}_seven_story_entries.png').write_bytes(base64.b64decode(data))
    w.ev("document.querySelector('[data-p6-replay=\\\"lv3-v1\\\"]').click()")
    assert w.ev("Boolean(document.querySelector('.p6-story-chat'))")
    w.ev("document.getElementById('p2EventFinish').click()")
    assert w.ev("window.__A18_SCENE_STUDY__.state().museumLevel")==6

    report['runs'].append({'run':run,'phases':phases,'realGame':{'level':scene['museumLevel'],'works':len(scene['works']),'room':scene['galleryIndex']},'browserExceptions':sum(x.get('method')=='Runtime.exceptionThrown' for x in w.console)})
    (RESULTS/f'run_{run}.json').write_text(json.dumps(report['runs'][-1],ensure_ascii=False,indent=2),'utf-8')
    if report['runs'][-1]['browserExceptions']:raise AssertionError('Browser unhandled exceptions: '+str(w.console)[:1000])
   finally:
    subprocess.run(['taskkill','/F','/T','/PID',str(chrome.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 # Separate first-boot profile for actual startup screenshot
 with tempfile.TemporaryDirectory(prefix='a18-v3-lv1-capture-',ignore_cleanup_errors=True) as profile:
  chrome=launch(profile,9809)
  try:
   w=attach(9809);w.call('Page.enable');w.call('Runtime.enable')
   w.call('Emulation.setDeviceMetricsOverride',{'width':844,'height':390,'deviceScaleFactor':1,'mobile':True})
   w.call('Page.navigate',{'url':game})
   start=time.monotonic()
   while time.monotonic()-start<15:
    if w.ev("Boolean(window.__A18_SCENE_STUDY__?.ready())"):break
    time.sleep(.2)
   else:raise TimeoutError('real first-boot game not ready')
   s=w.ev('window.__A18_SCENE_STUDY__.state()')
   assert s['museumLevel']==1 and len(s['works'])==0
   data=w.call('Page.captureScreenshot',{'format':'png'})['data']
   (RESULTS/'lv1_first_boot_game.png').write_bytes(base64.b64decode(data))
   report['lv1FirstBoot']={'level':s['museumLevel'],'works':len(s['works']),'room':s['galleryIndex']}
   # Actual UI onboarding and post-commit persisted profile.
   assert w.ev("Boolean(document.getElementById('introSkipOpening'))")
   w.ev("document.getElementById('introSkipOpening').click()")
   assert w.ev("Boolean(document.getElementById('confirmName'))")
   w.ev("""document.getElementById('a18PlayerName').value='正式v3テスト';
          document.getElementById('a18MuseumTitle').value='保存検証館';
          document.getElementById('confirmName').click()""")
   start=time.monotonic()
   while time.monotonic()-start<8:
    if w.ev("window.__A18_SCENE_STUDY__.state().playerName==='正式v3テスト'"):break
    time.sleep(.1)
   else:raise AssertionError('real UI profile confirmation failed')
   assert w.ev("Boolean(document.getElementById('startTour'))")
   w.ev("document.getElementById('startTour').click()")
   start=time.monotonic()
   while time.monotonic()-start<8:
    if w.ev("(async()=>{const s=await window.A18P2Store.load();return s.playerName==='正式v3テスト'&&s.progression.events[0].status==='seen'})()"):break
    time.sleep(.1)
   else:raise AssertionError('profile and intro CAS not persisted')
   data=w.call('Page.captureScreenshot',{'format':'png'})['data']
   (RESULTS/'lv1_after_profile_game.png').write_bytes(base64.b64decode(data))
   w.call('Page.reload',{'ignoreCache':True})
   start=time.monotonic()
   while time.monotonic()-start<15:
    if w.ev("Boolean(window.__A18_SCENE_STUDY__?.ready())"):break
    time.sleep(.15)
   else:raise TimeoutError('Lv1 profile reload not ready')
   assert w.ev("window.__A18_SCENE_STUDY__.state().playerName")=='正式v3テスト'
   assert w.ev("window.__A18_SCENE_STUDY__.state().museumLevel")==1
   assert w.ev("window.A18P2Store.validate!==undefined")
   report['lv1ProfileAfterReload']=True
   data=w.call('Page.captureScreenshot',{'format':'png'})['data']
   (RESULTS/'lv1_profile_restored_game.png').write_bytes(base64.b64decode(data))
  finally:subprocess.run(['taskkill','/F','/T','/PID',str(chrome.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 report['passed']=True
except Exception as e:
 report['passed']=False;report['failure']=repr(e);traceback.print_exc()
finally:
 http.shutdown()
 (RESULTS/'verified_summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf-8')
 print('FINAL',report['passed'],report.get('failure'),flush=True)
if not report['passed']:raise SystemExit(1)
