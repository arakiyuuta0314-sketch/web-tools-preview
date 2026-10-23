"""Separate P2 Chrome profiles: real two-tab CAS and failure on third frame."""
import json, subprocess, tempfile, time, traceback, urllib.request, urllib.parse
from pathlib import Path
main=Path(__file__).with_name('p2-e2e.py').read_text(encoding='utf-8')
ns={}
exec(main.split('all_results=[];failure=None')[0],ns)
WS=ns['WS'];Runner=ns['Runner'];launch=ns['launch'];attach=ns['attach'];step_image=ns['step_image'];ROOT=ns['ROOT'];URL=ns['URL']
all_results=[];failures=[]
def setup(w):
 w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
 w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
 w.call('Page.navigate',{'url':URL});w.ready()
def profile_run(kind,port):
 with tempfile.TemporaryDirectory(prefix='a18-p2-fault-'+kind+'-',ignore_cleanup_errors=True) as profile:
  process=launch(profile,port)
  try:
   a=attach(port);setup(a);r=Runner(a)
   if kind=='multi-tab':
    # Open physically distinct tab on same origin and profile, both at revision 0.
    new=urllib.request.Request(f'http://127.0.0.1:{port}/json/new?'+urllib.parse.quote(URL,safe=''),method='PUT')
    target=json.load(urllib.request.urlopen(new,timeout=8))
    b=WS(target['webSocketDebuggerUrl'])
    b.call('Page.enable');b.call('Runtime.enable');b.call('Log.enable')
    b.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
    b.ready()
    r.check('A_initial_revision',"window.__A18_SCENE_STUDY__.p2.persistent().revision",0)
    br=Runner(b);br.check('B_initial_revision',"window.__A18_SCENE_STUDY__.p2.persistent().revision",0)
    if not step_image(a,'TAB-A-ONLY'):raise AssertionError('Tab A save failed')
    br.check('B_conflict_rejected',"window.__A18_SCENE_STUDY__.p2.addSyntheticWork('TAB-B-FAIL',new Blob(['B'],{type:'image/png'}))",False)
    br.check('B_blocked_after_conflict',"window.__A18_SCENE_STUDY__.p2.blocked()",True)
    r.check('A_winner_persisted',"window.__A18_SCENE_STUDY__.p2.persistent().works.some(w=>w.id==='TAB-A-ONLY')")
    r.check('B_writes_absent',"window.__A18_SCENE_STUDY__.p2.persistent().works.some(w=>w.id==='TAB-B-FAIL')",False)
    br.check('database_contains_only_A',"(async()=>{let x=await window.A18P2Store.load();return x.works.length===1&&x.works[0].id==='TAB-A-ONLY'})()")
    r.check('B_unknown_schema_failfast',"(function(){try{window.A18P2Store.validate({schemaVersion:2});return false}catch(e){return e.code==='E_SCHEMA_UNKNOWN'}})()")
    all_results.extend(r.results+br.results)
    if [z for z in a.console+b.console if z.get('method')=='Runtime.exceptionThrown']:raise AssertionError('Uncaught exception')
    return
   # Interactive onboarding saved into isolated DB.
   a.ev("""document.getElementById('a18PlayerName').value='故障試験';
    document.getElementById('confirmName').click()""")
   a.wait("window.__A18_SCENE_STUDY__.state().playerName==='故障試験'")
   a.ev("document.getElementById('startTour').click()")
   if kind=='ui-register':
    a.ev("window.__A18_SCENE_STUDY__.form(0,true,'butler')")
    a.ev("""(()=>{
     document.getElementById('name').value='実フォーム登録作品';
     document.getElementById('notes').value='ユーザーの大切な備考：123';
     const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+pdFKVAAAAABJRU5ErkJggg=='),x=>x.charCodeAt(0));
     const dt=new DataTransfer();dt.items.add(new File([bytes],'sample.png',{type:'image/png'}));
     document.getElementById('photo').files=dt.files;
     document.getElementById('save').click();
    })()""")
    a.wait("Boolean(document.getElementById('offerNo'))")
    a.ev("document.getElementById('offerNo').click()")
    a.wait("Boolean(document.getElementById('receiveWork'))")
    r.check('form_registration_committed',"window.__A18_SCENE_STUDY__.state().works.length",1)
    r.check('form_registration_notes',"window.__A18_SCENE_STUDY__.state().works[0].notes",'ユーザーの大切な備考：123')
    r.check('form_registration_blob',"window.__A18_SCENE_STUDY__.p2.persistent().works[0].originalBlob instanceof Blob")
    r.check('form_registration_carried',"window.__A18_SCENE_STUDY__.state().carrying===window.__A18_SCENE_STUDY__.state().works[0].id")
    a.ev("document.getElementById('receiveWork').click()")
    a.ev("window.__A18_SCENE_STUDY__.inspect(0)")
    a.wait("window.__A18_SCENE_STUDY__.state().works[0].fixtureId==='frame-0-0'")
    r.check('form_display_success',"window.__A18_SCENE_STUDY__.state().museumLevel",1)
    a.capture('06_real_photo_registration_390x844.png')
    a.call('Page.reload',{'ignoreCache':True});a.ready()
    r.check('form_reloaded_blob_and_note',"(async()=>{const w=window.__A18_SCENE_STUDY__.p2.persistent().works[0];return w.fixtureId==='frame-0-0'&&w.originalBlob.size>0&&w.notes==='ユーザーの大切な備考：123'})()")
    r.check('graph_7_edges',"Object.values(window.A18Layout.ROOM_LINKS).reduce((a,b)=>a+Object.keys(b).length,0)",14)
    r.check('graph_open_counts',"([0,1,2,3,4,7].every((expected,i)=>{let lv=i+1;let count=0;for(const [room,edges] of Object.entries(window.A18Layout.ROOM_LINKS))for(const edge of Object.keys(edges))if(window.A18P2Store.canTraverse(+room,edge,{unlockedThroughLevel:lv}))count++;return count===expected*2}))")
    a.ev("window.__A18_SCENE_STUDY__.showFloorMap()")
    r.check('map_locked_5_rooms',"document.querySelectorAll('.a18-room-tile.locked').length",5)
    a.capture('07_lv1_map_locked_390x844.png')
   elif kind=='ui-crud':
    for i in range(2):
     if not step_image(a,'CRUD-'+str(i)):raise AssertionError('register')
     a.ev('window.__A18_SCENE_STUDY__.inspect('+str(i)+')')
     a.wait('window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length==='+str(i+1))
    a.ev("window.__A18_SCENE_STUDY__.inspect(0)")
    a.ev("document.getElementById('editNote').click()")
    a.ev("""document.getElementById('editMemo').value='変更後のメモ：作品原本を保持';document.getElementById('saveMemo').click()""")
    a.wait("window.__A18_SCENE_STUDY__.state().works[0].notes==='変更後のメモ：作品原本を保持'")
    r.check('memo_preserved',"window.__A18_SCENE_STUDY__.state().works[0].notes",'変更後のメモ：作品原本を保持')
    a.ev("document.getElementById('lift').click()")
    a.wait("window.__A18_SCENE_STUDY__.state().carrying==='CRUD-0'")
    a.ev("window.__A18_SCENE_STUDY__.inspect(1)")
    a.wait("window.__A18_SCENE_STUDY__.state().carrying==='CRUD-1'")
    r.check('exchange_old_unmounted',"window.__A18_SCENE_STUDY__.state().works.find(w=>w.id==='CRUD-1').fixtureId",None)
    r.check('exchange_new_displayed',"window.__A18_SCENE_STUDY__.state().works.find(w=>w.id==='CRUD-0').fixtureId",'frame-0-1')
    a.ev("document.getElementById('cancel').click()")
    a.wait("window.__A18_SCENE_STUDY__.state().carrying===null")
    r.check('stored_work_retains_blob',"window.__A18_SCENE_STUDY__.p2.persistent().works.find(w=>w.id==='CRUD-1').originalBlob instanceof Blob")
    a.ev("window.__A18_SCENE_STUDY__.list()")
    a.ev("document.querySelector('[data-delete-work=\"CRUD-1\"]').click()")
    a.ev("document.getElementById('confirmDelete').click()")
    a.wait("window.__A18_SCENE_STUDY__.state().works.length===1")
    r.check('delete_exact_one',"window.__A18_SCENE_STUDY__.state().works[0].id",'CRUD-0')
    r.check('remaining_id_and_memo',"window.__A18_SCENE_STUDY__.state().works[0].notes",'変更後のメモ：作品原本を保持')
    a.capture('04_ui_crud_390x844.png')
   else:
    for i in range(2):
     if not step_image(a,'FAIL-'+str(i)):raise AssertionError('registration '+str(i))
     a.ev('window.__A18_SCENE_STUDY__.inspect('+str(i)+')')
     a.wait('window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length==='+str(i+1))
    r.check(kind+'_two_of_three',"window.__A18_SCENE_STUDY__.state().museumLevel",1)
    if not step_image(a,'FAIL-2'):raise AssertionError('registration third')
    before=a.ev("window.__A18_SCENE_STUDY__.p2.persistent().revision")
    a.ev("window.__A18_SCENE_STUDY__.p2.injectFault('"+kind+"')")
    a.ev("window.__A18_SCENE_STUDY__.inspect(2)")
    a.wait('window.__A18_SCENE_STUDY__.p2.blocked()')
    r.check(kind+'_level_unchanged',"window.__A18_SCENE_STUDY__.state().museumLevel",1)
    r.check(kind+'_still_two',"window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length",2)
    r.check(kind+'_event_not_created',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length",0)
    r.check(kind+'_revision_not_changed',"window.__A18_SCENE_STUDY__.p2.persistent().revision",before)
    r.check(kind+'_disk_old_state',"(async()=>{let z=await window.A18P2Store.load();return z.revision==="+str(before)+"&&z.progression.unlockedThroughLevel===1&&z.works.filter(w=>w.fixtureId).length===2})()")
    a.capture('05_'+kind+'_failure_390x844.png')
    a.call('Page.reload',{'ignoreCache':True});a.ready()
    r.check(kind+'_reload_lv1',"window.__A18_SCENE_STUDY__.state().museumLevel",1)
    r.check(kind+'_reload_2frames',"window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length",2)
   all_results.extend(r.results)
   if [z for z in a.console if z.get('method')=='Runtime.exceptionThrown']:raise AssertionError('Uncaught exception '+kind)
  finally:
   subprocess.run(['taskkill','/F','/T','/PID',str(process.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
for kind,port in [('multi-tab',9251),('abort',9252),('quota',9253),('ui-crud',9254),('ui-register',9255)]:
 try:
  profile_run(kind,port)
  print('PASS',kind)
 except Exception as e:
  failures.append({'scenario':kind,'error':repr(e)})
  print('FAIL',kind,repr(e));traceback.print_exc()
(ROOT/'p2_failure_e2e_results.json').write_text(json.dumps({'tests':all_results,'failures':failures},ensure_ascii=False,indent=2),encoding='utf-8')
print('SUMMARY',len(all_results), 'tests; failures:',failures)
if failures:raise SystemExit(1)
