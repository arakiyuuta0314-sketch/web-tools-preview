"""P4 special failures at final exhibition, CAS two physical tabs, locked restore guard."""
from pathlib import Path
import json, subprocess, tempfile, traceback, urllib.request, urllib.parse, time
ns={}
exec(Path(__file__).with_name('p4-p2-regression-e2e.py').read_text('utf-8').split('all_results=[];failure=None')[0],ns)
WS,Runner,launch,attach,step_image=(*(ns[k] for k in ('WS','Runner','launch','attach','step_image')),)
ROOT,URL=ns['ROOT'],ns['URL']
all_results=[];failures=[]
def setup(w):
 w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
 w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
 w.call('Page.navigate',{'url':URL});w.ready()
def digest():
 return """(async()=>{const s=await window.A18P2Store.load();
 return JSON.stringify({revision:s.revision,room:s.galleryIndex,pos:s.pos,carrying:s.carrying,
  progress:s.progression,fixtures:s.fixtures,
  works:await Promise.all(s.works.map(async w=>({id:w.id,notes:w.notes,title:w.title,fixtureId:w.fixtureId,
  preferredShape:w.preferredShape,thumbnail:w.thumbnail,displaySrc:w.displaySrc,
  blobType:w.originalBlob.type,blobSize:w.originalBlob.size,
  hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await w.originalBlob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('')
  })))});})()"""
def nav(w,to):
 links=w.ev("window.__A18_SCENE_STUDY__.state().allRoomLinks")
 lv=w.ev("window.__A18_SCENE_STUDY__.state().museumLevel")
 now=w.ev("window.__A18_SCENE_STUDY__.state().galleryIndex")
 paths={str(now):[]};q=[str(now)]
 while q and str(to) not in paths:
  v=q.pop(0)
  for u in links[v].values():
   u=str(u)
   if int(u)<lv and u not in paths:paths[u]=paths[v]+[int(u)];q.append(u)
 for n in paths[str(to)]:
  assert w.ev(f"window.__A18_SCENE_STUDY__.changeScene({n})"),(now,n)
def registered(w,room,i):
 name=f'F-{room}-{i}'
 assert step_image(w,name),name
 slot=i if room==0 else 5+(room-1)*5+i
 w.ev(f'window.__A18_SCENE_STUDY__.inspect({slot})')
 w.wait(f"window.__A18_SCENE_STUDY__.state().works.find(w=>w.id==='{name}')?.fixtureId==='frame-{room}-{i}'")
def case_final():
 with tempfile.TemporaryDirectory(prefix='a18-p4-failure-',ignore_cleanup_errors=True) as profile:
  proc=launch(profile,9548)
  try:
   w=attach(9548);setup(w);r=Runner(w)
   w.ev("document.getElementById('a18PlayerName').value='終端故障試験';document.getElementById('confirmName').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().playerName==='終端故障試験'")
   w.ev("document.getElementById('startTour').click()")
   for room in range(6):
    for i in range(3 if room==0 else 5):
     if room==5 and i==4:break
     registered(w,room,i)
    if room<5:
     eventId=f'lv{room+2}-v1'
     r.check('event_ready_'+eventId,f"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='{eventId}'&&e.status==='queued').length",1)
     w.ev("document.getElementById('p2EventSkip').click()" if room==2 else "document.getElementById('p2EventFinish').click()")
     wanted='available' if room==2 else 'seen'
     w.wait(f"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='{eventId}')?.status==='{wanted}'")
     nav(w,room+1)
   r.check('pre_final_level_6',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   r.check('pre_final_27_displayed',"window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length",27)
   r.check('pre_final_no_award_5',"window.__A18_SCENE_STUDY__.p2.persistent().progression.awardedRoomIds.includes(5)",False)
   r.check('skip_level4_available',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='lv4-v1').status",'available')
   assert step_image(w,'F-5-4')
   prior=w.ev(digest())
   r.check('holding_last_piece',"window.__A18_SCENE_STUDY__.state().carrying",'F-5-4')
   w.ev("window.__A18_SCENE_STUDY__.p2.injectFault('abort')")
   w.ev("window.__A18_SCENE_STUDY__.inspect(29)")
   w.wait("window.__A18_SCENE_STUDY__.p2.blocked()")
   r.check('fault_no_level7',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   r.check('fault_final_event_not_issued',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.some(e=>e.id==='gallery06-complete-v1')",False)
   r.check('fault_award_not_issued',"window.__A18_SCENE_STUDY__.p2.persistent().progression.awardedRoomIds.includes(5)",False)
   r.check('fault_entire_disk_record_identical',digest(),prior)
   w.capture('P4_final_frame_abort_390x844.png')
   w.call('Page.reload',{'ignoreCache':True});w.ready()
   r.check('restored_27_exhibits',"window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length",27)
   r.check('restored_holding_final',"window.__A18_SCENE_STUDY__.state().carrying",'F-5-4')
   r.check('restart_exact_disk_recovery',digest(),prior)
   w.ev("window.__A18_SCENE_STUDY__.inspect(29)")
   w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.awardedRoomIds.includes(5)")
   r.check('finally_event_once',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='gallery06-complete-v1').length",1)
   r.check('finally_28',"window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length",28)
   r.check('finally_level_still6',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   w.ev("document.getElementById('p2EventSkip').click()")
   w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='gallery06-complete-v1')?.status==='available'")
   r.check('final_skip_available',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='gallery06-complete-v1').status",'available')
   # Same profile, two actual Chrome tabs with independent stale revisions.
   new=urllib.request.Request('http://127.0.0.1:9548/json/new?'+urllib.parse.quote(URL,safe=''),method='PUT')
   info=json.load(urllib.request.urlopen(new,timeout=8))
   b=WS(info['webSocketDebuggerUrl'])
   b.call('Page.enable');b.call('Runtime.enable')
   b.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True});b.ready()
   r.check('two_tab_equal_revision',"window.__A18_SCENE_STUDY__.p2.persistent().revision===Number("+str(b.ev("window.__A18_SCENE_STUDY__.p2.persistent().revision"))+")",True)
   assert step_image(w,'TAB-A-FINAL')
   r.check('late_tab_cas_rejected',"window.__A18_SCENE_STUDY__.p2.persistent().works.some(w=>w.id==='TAB-A-FINAL')",True)
   r.check('late_tab_B_reject',"(async()=>{const x=await window.A18P2Store.load();return x.progression.unlockedThroughLevel===6&&x.progression.awardedRoomIds.includes(5)})()",True)
   rr=Runner(b)
   rr.check('late_tab_attempt_B', "window.__A18_SCENE_STUDY__.p2.addSyntheticWork('TAB-B-STALE',new Blob(['bad'],{type:'image/png'}))",False)
   rr.check('late_tab_ui_blocked',"window.__A18_SCENE_STUDY__.p2.blocked()",True)
   rr.check('late_tab_B_not_persisted',"(async()=>{const x=await window.A18P2Store.load();return !x.works.some(w=>w.id==='TAB-B-STALE')&&x.progression.awardedRoomIds.includes(5)})()",True)
   all_results.extend(r.results+rr.results)
   print('P4 final fault tests',len(r.results)+len(rr.results))
  finally:subprocess.run(['taskkill','/F','/T','/PID',str(proc.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def case_locked_restoration():
 with tempfile.TemporaryDirectory(prefix='a18-p4-locked-',ignore_cleanup_errors=True) as profile:
  proc=launch(profile,9549)
  try:
   w=attach(9549);setup(w);r=Runner(w)
   r.check('lock_start_lv1',"window.__A18_SCENE_STUDY__.state().museumLevel",1)
   r.check('validator_rejects_level7',"(()=>{const z=window.A18P2Store.initial();z.progression.unlockedThroughLevel=7;try{window.A18P2Store.validate(z);return false}catch(e){return e.code==='E_PROGRESSION_INVARIANT'}})()",True)
   r.check('validator_rejects_restore_into_room5',"(()=>{const z=window.A18P2Store.initial();z.galleryIndex=5;try{window.A18P2Store.validate(z);return false}catch(e){return e.code==='E_ROOM_LOCKED'}})()",True)
   # Injection into an isolated synthetic profile only. Must not auto repair or move on boot.
   r.check('synthetic_corrupt_db_created',"""(async()=>{const db=await new Promise((ok,bad)=>{const q=indexedDB.open(window.A18P2Store.DATABASE);q.onsuccess=()=>ok(q.result);q.onerror=()=>bad(q.error)});
    return await new Promise((ok,bad)=>{const tx=db.transaction('states','readwrite'),s=tx.objectStore('states');
      const rq=s.get('museum');rq.onsuccess=()=>{const z=rq.result;z.galleryIndex=5;s.put(z,'museum')};
      tx.oncomplete=()=>ok(true);tx.onabort=()=>bad(tx.error)})})()""",True)
   w.call('Page.reload',{'ignoreCache':True})
   time.sleep(.8)
   r.check('invalid_restore_not_ready',"Boolean(window.__A18_SCENE_STUDY__?.ready())",False)
   r.check('invalid_restore_error_code',"document.getElementById('hint')?.textContent.includes('E_ROOM_LOCKED')",True)
   r.check('invalid_restore_no_repair',"(async()=>{const db=await new Promise(ok=>{const q=indexedDB.open(window.A18P2Store.DATABASE);q.onsuccess=()=>ok(q.result)});return await new Promise(ok=>{const rq=db.transaction('states','readonly').objectStore('states').get('museum');rq.onsuccess=()=>ok(rq.result.galleryIndex===5)})})()",True)
   w.capture('P4_locked_restore_failfast_390x844.png')
   all_results.extend(r.results)
   print('P4 locked restoration tests',len(r.results))
  finally:subprocess.run(['taskkill','/F','/T','/PID',str(proc.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
for name,fn in [('last-frame-atomicity-two-tabs',case_final),('locked-restoration',case_locked_restoration)]:
 try:fn()
 except Exception as e:failures.append({'case':name,'error':repr(e)});traceback.print_exc()
(ROOT/'p4_fault_e2e_results.json').write_text(json.dumps({'passed':sum(x['pass'] for x in all_results),'results':all_results,'failures':failures},ensure_ascii=False,indent=2),encoding='utf-8')
print('P4 FAULT SUMMARY',len(all_results),failures)
if failures:raise SystemExit(1)
