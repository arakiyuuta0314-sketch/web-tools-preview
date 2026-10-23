"""A18 P2 isolated Chrome E2E. ONLY uses temporary Chrome profile and P2 DB."""
import base64, json, os, socket, struct, subprocess, time, urllib.request, traceback
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlparse
CHROME=r'C:\Program Files\Google\Chrome\Application\chrome.exe'
ROOT=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\07_P2_Lv1-Lv2実装')
ROOT.mkdir(parents=True,exist_ok=True)
URL='http://127.0.0.1:8875/layout-test/index.html?p2-e2e=1'
class WS:
 def __init__(self,url):
  p=urlparse(url);self.s=socket.create_connection((p.hostname,p.port),timeout=7);self.s.settimeout(20)
  key=base64.b64encode(os.urandom(16)).decode()
  self.s.sendall((f'GET {p.path} HTTP/1.1\r\nHost: {p.hostname}:{p.port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: {key}\r\n\r\n').encode())
  buf=b''
  while b'\r\n\r\n' not in buf:buf+=self.s.recv(4096)
  if b'101 WebSocket' not in buf:raise RuntimeError('Handshake '+repr(buf[:200]))
  self.extra=buf.split(b'\r\n\r\n',1)[1];self.count=0;self.console=[]
 def read(self,n):
  while len(self.extra)<n:self.extra+=self.s.recv(max(n-len(self.extra),4096))
  data=self.extra[:n];self.extra=self.extra[n:];return data
 def send(self,obj):
  data=json.dumps(obj).encode();mask=os.urandom(4);n=len(data)
  head=bytes([0x81,(0x80|n) if n<126 else (0x80|126 if n<65536 else 0x80|127)])
  if n>=65536:head+=struct.pack('!Q',n)
  elif n>=126:head+=struct.pack('!H',n)
  self.s.sendall(head+mask+bytes(data[i]^mask[i%4] for i in range(n)))
 def recv(self):
  a,b=self.read(2);n=b&127
  if n==126:n=struct.unpack('!H',self.read(2))[0]
  elif n==127:n=struct.unpack('!Q',self.read(8))[0]
  mask=self.read(4) if b&128 else None
  data=self.read(n)
  if mask:data=bytes(data[i]^mask[i%4] for i in range(n))
  if a&15==9:return None
  result=json.loads(data.decode())
  if result.get('method') in ('Runtime.exceptionThrown','Log.entryAdded') or result.get('method')=='Runtime.consoleAPICalled' and result.get('params',{}).get('type')=='error':
   self.console.append(result)
  return result
 def call(self,method,params=None):
  self.count+=1;num=self.count;self.send({'id':num,'method':method,'params':params or {}})
  while True:
   reply=self.recv()
   if reply and reply.get('id')==num:
    if 'error' in reply:raise RuntimeError(str(reply['error']))
    return reply.get('result',{})
 def ev(self,expr):
  reply=self.call('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True,'userGesture':True})
  if 'exceptionDetails' in reply:raise RuntimeError('JS '+repr(reply['exceptionDetails'])[:1100])
  return reply.get('result',{}).get('value')
 def capture(self,name):
  data=self.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']
  (ROOT/name).write_bytes(base64.b64decode(data))
 def ready(self):
  start=time.time()
  while time.time()-start<25:
   try:
    if self.ev("Boolean(window.__A18_SCENE_STUDY__?.ready())"):return
   except Exception:pass
   time.sleep(.2)
  raise TimeoutError('Game not ready '+str(self.ev("document.getElementById('hint')?.textContent")))
 def wait(self,condition,timeout=6):
  start=time.time()
  while time.time()-start<timeout:
   if self.ev(condition):return
   time.sleep(.1)
  raise AssertionError('WAIT timeout '+condition+' hint='+str(self.ev("document.getElementById('hint')?.textContent")))
class Runner:
 def __init__(self,w):self.w=w;self.results=[]
 def check(self,name,expr,expected=True):
  actual=self.w.ev(expr)
  ok=actual==expected
  self.results.append({'name':name,'pass':ok,'actual':actual,'expected':expected})
  if not ok:raise AssertionError(name+': '+repr(actual)+' != '+repr(expected))
 def js(self,e):return self.w.ev(e)
def launch(profile,port=9248):
 command=[CHROME,'--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-extensions',
 '--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port='+str(port),
 '--user-data-dir='+str(profile),'about:blank']
 return subprocess.Popen(command,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def attach(port):
 start=time.time()
 while time.time()-start<12:
  try:
   pages=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=2))
   page=next(x for x in pages if x['type']=='page')
   return WS(page['webSocketDebuggerUrl'])
  except Exception:time.sleep(.2)
 raise RuntimeError('CDP unavailable')
def step_image(w,id):
 return w.ev("""(async()=>{
  const b=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+pdFKVAAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0));
  return await window.__A18_SCENE_STUDY__.p2.addSyntheticWork('"""+id+"""',new Blob([b],{type:'image/png'}),'備考_'+ '"""+id+"""');
 })()""")
all_results=[];failure=None
try:
 with TemporaryDirectory(prefix='a18-p2-isolated-',ignore_cleanup_errors=True) as profile:
  process=launch(profile)
  try:
   w=attach(9248)
   w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
   w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
   w.call('Page.navigate',{'url':URL});w.ready();r=Runner(w)
   r.check('startup_new_schema3',"window.__A18_SCENE_STUDY__.p2.persistent().schemaVersion",3)
   r.check('startup_lv1',"window.__A18_SCENE_STUDY__.state().museumLevel",1)
   r.check('startup_room0',"window.__A18_SCENE_STUDY__.state().galleryIndex",0)
   r.check('frame_count_28',"window.__A18_SCENE_STUDY__.p2.persistent().fixtures.filter(f=>f.kind==='frame').length",28)
   r.check('zero_of_three',"window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId?.startsWith('frame-0-')).length",0)
   r.check('north_wall_locked',"window.__A18_SCENE_STUDY__.canMove(367,145)",False)
   r.check('west_east_north_locked',"""['west','east','north'].every(e=>!window.A18P2Store.canTraverse(0,e,window.__A18_SCENE_STUDY__.p2.persistent().progression))""")
   r.check('direct_scene_denied',"""(async()=>{try{await window.__A18_SCENE_STUDY__.changeScene(1);return false}catch(e){return e.message==='E_ROOM_LOCKED'}})()""")
   w.capture('01_lv1_locked_390x844.png')
   # Open first-time profile through actual form.
   r.js("""document.getElementById('a18PlayerName').value='P2テスト';document.getElementById('a18MuseumTitle').value='テスト美術館';
    document.getElementById('confirmName').click()""")
   w.wait("window.__A18_SCENE_STUDY__.state().playerName==='P2テスト'")
   r.js("document.getElementById('startTour').click()")
   for n in range(3):
    wid='P2-W'+str(n)
    if not step_image(w,wid):raise AssertionError('synthetic registration failed '+wid)
    r.check('registered_holding_'+str(n),"window.__A18_SCENE_STUDY__.state().carrying",wid)
    r.check('registered_not_level_'+str(n),"window.__A18_SCENE_STUDY__.state().museumLevel",1)
    r.js("window.__A18_SCENE_STUDY__.inspect("+str(n)+")")
    w.wait("window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId?.startsWith('frame-0-')).length==="+str(n+1))
    r.check('completed_count_'+str(n),"window.__A18_SCENE_STUDY__.state().museumLevel",1 if n<2 else 2)
   r.check('queued_event_once',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='lv2-v1'&&e.status==='queued').length",1)
   r.check('lv2_still_room0',"window.__A18_SCENE_STUDY__.state().galleryIndex",0)
   w.capture('02_lv2_event_390x844.png')
   r.js("document.getElementById('p2EventFinish').click()")
   w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events[0].status==='seen'")
   r.check('lv2_only_west_open',"window.A18P2Store.canTraverse(0,'west',window.__A18_SCENE_STUDY__.p2.persistent().progression)")
   r.check('lv2_east_locked',"window.A18P2Store.canTraverse(0,'east',window.__A18_SCENE_STUDY__.p2.persistent().progression)",False)
   r.check('lv2_north_locked',"window.A18P2Store.canTraverse(0,'north',window.__A18_SCENE_STUDY__.p2.persistent().progression)",False)
   # Moving to the actual west portal with game movement; entry is asynchronous committed.
   for _ in range(3):r.js("window.__A18_SCENE_STUDY__.move('up')")
   for _ in range(26):r.js("window.__A18_SCENE_STUDY__.move('left')")
   w.wait("window.__A18_SCENE_STUDY__.state().galleryIndex===1",timeout=8)
   r.check('walk_enter_gallery02',"window.__A18_SCENE_STUDY__.state().galleryIndex",1)
   r.check('gallery04_north_locked',"window.A18P2Store.canTraverse(1,'north',window.__A18_SCENE_STUDY__.p2.persistent().progression)",False)
   w.capture('03_gallery02_390x844.png')
   for _ in range(5):r.js("window.__A18_SCENE_STUDY__.move('right')")
   w.wait("window.__A18_SCENE_STUDY__.state().galleryIndex===0",timeout=8)
   r.check('walk_return_entrance',"window.__A18_SCENE_STUDY__.state().galleryIndex",0)
   r.check('no_event_duplication',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='lv2-v1').length",1)
   # Exact byte hash + identity of fixture and memo before restart.
   digest="""(async()=>{const s=window.__A18_SCENE_STUDY__.p2.persistent();return JSON.stringify(await Promise.all(s.works.map(async w=>({id:w.id,notes:w.notes,fixtureId:w.fixtureId,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await w.originalBlob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('')}))));})()"""
   before=r.js(digest)
   w.call('Page.reload',{'ignoreCache':True});w.ready()
   r.check('reload_lv2',"window.__A18_SCENE_STUDY__.state().museumLevel",2)
   r.check('reload_no_replay',"Boolean(document.getElementById('p2EventFinish'))",False)
   r.check('reload_blob_fixture_notes',digest,before)
   r.js("window.__A18_SCENE_STUDY__.inspect(0)")
   r.js("document.getElementById('lift').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().carrying==='P2-W0'")
   r.check('lift_no_downgrade',"window.__A18_SCENE_STUDY__.state().museumLevel",2)
   r.js("document.getElementById('cancel').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().carrying===null")
   r.check('stored_not_exhibited',"window.__A18_SCENE_STUDY__.state().works.find(w=>w.id==='P2-W0').fixtureId",None)
   r.check('still_no_duplicate',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length",1)
   # Two tab CAS on actual IndexedDB; two old revisions compete.
   rev=r.js("window.__A18_SCENE_STUDY__.p2.persistent().revision")
   r.check('two_tab_conflict_synthetic',"""(async()=>{const s=window.A18P2Store;const a=await s.load(),b=await s.load();
    const one=s.copy(a);one.revision++;one.museumTitle='A勝利';await s.commit(a.revision,one);
    const two=s.copy(b);two.revision++;two.museumTitle='B上書き禁止';
    try{await s.commit(b.revision,two);return false}catch(e){return e.code==='E_SAVE_CONFLICT'&&(await s.load()).museumTitle==='A勝利';}})()""")
   r.check('old_session_conflict_blocks_ui',"""(async()=>{window.__A18_SCENE_STUDY__.p2.injectFault('abort');
    return !(await window.__A18_SCENE_STUDY__.p2.addSyntheticWork('failed',new Blob(['bytes'],{type:'image/png'}))) && window.__A18_SCENE_STUDY__.p2.blocked()})()""")
   r.check('failed_not_saved',"window.__A18_SCENE_STUDY__.state().works.some(w=>w.id==='failed')",False)
   all_results+=r.results
   error_log=[e for e in w.console if e.get('method')=='Runtime.exceptionThrown']
   if error_log:raise AssertionError('Uncaught JS exceptions:'+str(error_log)[:1400])
   print('MAIN PASSES',len(r.results),'console-errors',len(w.console))
  finally:
   subprocess.run(['taskkill','/F','/T','/PID',str(process.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
except Exception as e:
 failure=repr(e)
 traceback.print_exc()
finally:
 (ROOT/'p2_e2e_results.json').write_text(json.dumps({'passed':sum(x['pass'] for x in all_results),
  'results':all_results,'failure':failure},ensure_ascii=False,indent=2),encoding='utf-8')
 print('SUMMARY',json.dumps({'passed':sum(x['pass'] for x in all_results),'failure':failure},ensure_ascii=False))
if failure:raise SystemExit(1)
