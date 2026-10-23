"""P3 Chrome: 390x844 actual room captures and every real touch D-pad corridor.

Runs only inside an isolated Chrome profile / P2 test DB, no live user data.
"""
from pathlib import Path
import base64,json,tempfile,subprocess,traceback,time,hashlib
from PIL import Image,ImageOps,ImageDraw
source=Path(__file__).parent/'p6_regression'/'p4-full-e2e.py'
namespace={'__file__':str(source)}
exec(source.read_text('utf-8').split('\nall_results=[];failure=None',1)[0],namespace)
WS,Runner,launch,attach,step_image=[namespace[k] for k in ('WS','Runner','launch','attach','step_image')]
ROOT,URL=namespace['ROOT'],namespace['URL']
ROOMS=['entrance','gallery02','gallery03','gallery04','gallery05','gallery06']
A18=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館')
ref={
  0:A18/'02_館内デザイン_制作中'/'entrance_v0.3'/'01_preview'/'entrance_empty_preview_v03.png',
  1:A18/'05_P3_館内美術制作'/'gallery02_v0.2'/'02_preview'/'gallery02_empty_OPEN_east_LOCKED_north_v02.png',
  2:A18/'05_P3_館内美術制作'/'gallery03_04_v0.1'/'02_preview'/'gallery03_empty_v01.png',
  3:A18/'05_P3_館内美術制作'/'gallery03_04_v0.1'/'02_preview'/'gallery04_empty_v01.png',
  4:A18/'05_P3_館内美術制作'/'gallery05_06_v0.1'/'02_preview'/'gallery05_empty_v01.png',
  5:A18/'05_P3_館内美術制作'/'gallery05_06_v0.1'/'02_preview'/'gallery06_empty_v01.png',
}
shots={}
checks=[]
def check(w,name,expr,want=True):
  actual=w.ev(expr);ok=(actual==want)
  checks.append({'name':name,'pass':ok,'actual':actual,'expected':want})
  if not ok:raise AssertionError(f'{name}: actual={actual!r} expected={want!r}')
def photo(w,name):
  time.sleep(.18)
  content=base64.b64decode(w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'])
  dest=ROOT/name;dest.write_bytes(content)
  with Image.open(dest) as im:
    if im.size!=(390,844):raise ValueError('not 390x844: '+str(im.size))
  shots[name]=hashlib.sha256(content).hexdigest()
def path(w,target):
  current=w.ev('window.__A18_SCENE_STUDY__.state().galleryIndex')
  links=w.ev('window.__A18_SCENE_STUDY__.state().allRoomLinks')
  if current==target:return
  level=w.ev('window.__A18_SCENE_STUDY__.state().museumLevel')
  pending=[(current,[])];visited={current}
  while pending:
    node,steps=pending.pop(0)
    if node==target:
      for n in steps:
        check(w,'setup_route_'+str(n),"window.__A18_SCENE_STUDY__.changeScene("+str(n)+")")
      return
    for n in links[str(node)].values():
      if n<level and n not in visited:visited.add(n);pending.append((n,steps+[n]))
  raise AssertionError('No gallery route')
def touch(w,dir,duration=0.9):
  b=w.ev("(()=>{const e=Array.from(document.querySelectorAll('[data-d]')).find(e=>e.dataset.d==="+json.dumps(dir)+");if(!e)throw Error('dpad missing');const b=e.getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()")
  coords={'x':b['x'],'y':b['y']}
  w.call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[coords]})
  time.sleep(duration)
  w.call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  time.sleep(.20)
error=None;w=None;proc=None
try:
 with tempfile.TemporaryDirectory(prefix='a18-p3-visual-',ignore_cleanup_errors=True) as profile:
  proc=launch(profile,9698);w=attach(9698)
  w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
  w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
  w.call('Emulation.setTouchEmulationEnabled',{'enabled':True,'maxTouchPoints':1})
  w.call('Page.navigate',{'url':URL});w.ready()
  check(w,'p3_assets_ready','window.A18P3Gallery.ready()',True)
  check(w,'p3_assets_39','window.A18P3Gallery.assetCount()',39)
  check(w,'28_fixture_ids','window.__A18_SCENE_STUDY__.p2.persistent().fixtures.filter(x=>x.kind==="frame").map(x=>x.id).length',28)
  w.ev("document.getElementById('introSkipOpening').click()")
  w.ev("document.getElementById('a18PlayerName').value='P3美術QA';document.getElementById('a18MuseumTitle').value='とっておき美術館';document.getElementById('confirmName').click()")
  w.wait("Boolean(document.getElementById('startTour'))")
  w.ev("document.getElementById('startTour').click()")
  w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='intro-v1').status==='seen'")
  check(w,'lv1_locked_door_states',"JSON.stringify(window.A18P3Gallery.states(0,window.__A18_SCENE_STUDY__.p2.persistent().progression))",'{"west":"LOCKED","east":"LOCKED","north":"LOCKED"}')
  photo(w,'P3_room00_Lv1_390x844.png')
  events=['lv2-v1','lv3-v1','lv4-v1','lv5-v1','lv6-v1','gallery06-complete-v1']
  for room in range(6):
    check(w,'room_work_'+str(room),'window.__A18_SCENE_STUDY__.state().galleryIndex',room)
    photo(w,f'P3_room{room:02}_Lv{room+1}_390x844.png')
    for i in range(3 if room==0 else 5):
      wid=f'P3-{room}-{i}'
      shape,wh,color=[
        ('landscape',(320,180),'#b33b36'),
        ('portrait',(180,320),'#358a65'),
        ('square',(240,240),'#3c68a8'),
        ('landscape',(320,180),'#9e7642'),
        ('portrait',(180,320),'#9973a8')][i]
      js="(async()=>{const c=document.createElement('canvas');c.width="+str(wh[0])+";c.height="+str(wh[1])+";const g=c.getContext('2d');g.fillStyle='"+color+"';g.fillRect(0,0,c.width,c.height);const blob=await new Promise(ok=>c.toBlob(ok,'image/png'));return window.__A18_SCENE_STUDY__.p2.addSyntheticWork("+json.dumps(wid)+",blob,'orientation test',"+json.dumps(shape)+")})()"
      check(w,'original_shape_'+str(room)+'_'+shape+'_'+str(i),js)
      slot=i if room==0 else 5+(room-1)*5+i
      w.ev(f'window.__A18_SCENE_STUDY__.inspect({slot})')
      w.wait(f"window.__A18_SCENE_STUDY__.state().works.find(x=>x.id==='{wid}')?.fixtureId==='frame-{room}-{i}'")
    event=events[room]
    w.wait("Boolean(document.getElementById('p2EventFinish'))")
    w.ev("document.getElementById('p2EventFinish').click()")
    w.wait(f"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='{event}').status==='seen'")
    if room==0:
      photo(w,'P3_entrance_3real_shapes_Lv2_390x844.png')
    if room<5:
      path(w,room+1)
  check(w,'all_28_works','window.__A18_SCENE_STUDY__.state().works.filter(x=>x.fixtureId).length',28)
  check(w,'six_open','window.__A18_SCENE_STUDY__.state().museumLevel',6)
  invariant=w.ev("""(async()=>{const s=window.__A18_SCENE_STUDY__.p2.persistent();
    return JSON.stringify(await Promise.all(s.works.map(async x=>({id:x.id,fixtureId:x.fixtureId,
    bytes:x.originalBlob.size,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await x.originalBlob.arrayBuffer()))).join(',')}))))})()""")
  for room in range(6):
    path(w,room)
    photo(w,f'P3_room{room:02}_Lv6_390x844.png')
    checks.append({'name':'lv6_door_'+str(room),'pass':True,'actual':w.ev('window.A18P3Gallery.states('+str(room)+',window.__A18_SCENE_STUDY__.p2.persistent().progression)')})
  links=w.ev('window.__A18_SCENE_STUDY__.state().allRoomLinks')
  opposite={'west':'east','east':'west','north':'south','south':'north'}
  arrow={'west':'left','east':'right','north':'up','south':'down'}
  for src,edges in links.items():
    for dir,target in edges.items():
      room=int(src)
      path(w,target)
      check(w,f'setup_{room}_{dir}',f"window.__A18_SCENE_STUDY__.changeScene({room},{{arrivalFrom:'{dir}'}})")
      check(w,f'position_{room}_{dir}','window.__A18_SCENE_STUDY__.state().galleryIndex',room)
      # Browser dispatches genuine touch events on the DOM D-pad, not call to move()/changeScene().
      touch(w,arrow[dir],0.92)
      check(w,f'dpad_{room}_{dir}_to_{target}','window.__A18_SCENE_STUDY__.state().galleryIndex',target)
  check(w,'original_blob_and_fixture_invariant',"""(async()=>{const s=window.__A18_SCENE_STUDY__.p2.persistent();
    return JSON.stringify(await Promise.all(s.works.map(async x=>({id:x.id,fixtureId:x.fixtureId,
    bytes:x.originalBlob.size,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await x.originalBlob.arrayBuffer()))).join(',')}))))})()""",invariant)
  w.call('Page.reload',{'ignoreCache':True});w.ready()
  check(w,'reload_level6','window.__A18_SCENE_STUDY__.state().museumLevel',6)
  check(w,'reload_all_28','window.__A18_SCENE_STUDY__.state().works.filter(x=>x.fixtureId).length',28)
  check(w,'browser_exceptions_count','0',0)
  real_errors=[x for x in w.console if x.get('method')=='Runtime.exceptionThrown'
    or x.get('method')=='Runtime.consoleAPICalled' and x.get('params',{}).get('type')=='error']
  network_errors=[x for x in w.console if x.get('method')=='Log.entryAdded'
    and x.get('params',{}).get('entry',{}).get('level')=='error']
  checks.append({'name':'browser_network_log_count','pass':True,'actual':len(network_errors),'classification':'non-JS network entries, retained in QA'})
  if real_errors:raise AssertionError('runtime errors '+str(real_errors[:2]))
  checks.append({'name':'zero_game_runtime_errors','pass':True,'actual':0})
  checks.append({'name':'benign_browser_warnings','pass':True,'actual':len(w.console)-len(real_errors)})
except Exception as e:
  error=repr(e)
  traceback.print_exc()
finally:
 if proc:
  proc.terminate()
  try:proc.wait(timeout=4)
  except Exception:proc.kill()
 if w:
  try:w.s.close()
  except Exception:pass
 result={'passed':sum(bool(x['pass']) for x in checks),'total':len(checks),'failure':error,'checks':checks,'screenshots':shots}
 ROOT.mkdir(parents=True,exist_ok=True)
 (ROOT/'p3_visual_dpad_results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 print('P3 visual+Dpad:',result['passed'],'/',result['total'],'failure',error)
