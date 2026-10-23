"""A18 P7A: production v3 full Chrome UI, photo/blob, D-pad, three viewports."""
from pathlib import Path
from tempfile import TemporaryDirectory
import time, subprocess, json, hashlib, base64, traceback
LIB=Path(__file__).resolve().parents[1]/'layout-test/tests/v3-release/run_browser.py'
ns={'__file__':str(LIB)}
exec(LIB.read_text('utf-8').split('try:\n for run in (1,2):')[0],ns)
launch,attach,http,url=ns['launch'],ns['attach'],ns['http'],ns['game']
OUT=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\20_P7C_任意項目修正・Web配布統合\full_browser_regression')
IMAGES=OUT/'screenshots'
IMAGES.mkdir(parents=True,exist_ok=True)
report={'branch':'feature/a18-p7c-optional-release-20261023','baseCommit':'01ba0c64a256d3fc92ba56ef9b519d6a50d8fe8e',
        'checks':[],'shots':{},'sizes':[],'dpad':[],'events':[],'exceptions':[],'failures':[]}
w=None;chrome=None
def get(js):return w.ev(js)
def chk(name,got,want=True):
    ok=got==want
    report['checks'].append({'name':name,'pass':ok,'actual':got,'expected':want})
    if not ok:raise AssertionError(f'{name}: {got!r} != {want!r}')
def wait(js,seconds=12):
    start=time.monotonic()
    while time.monotonic()-start<seconds:
        if get(js):return True
        time.sleep(.1)
    return False
def shot(name):
    content=base64.b64decode(w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'])
    (IMAGES/(name+'.png')).write_bytes(content)
    report['shots'][name+'.png']={'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content)}
def size(wid,hgt,context):
    w.call('Emulation.setDeviceMetricsOverride',{'width':wid,'height':hgt,'deviceScaleFactor':1,'mobile':True})
    time.sleep(.15)
    m=get("""(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
      overflowing:[...document.querySelectorAll('button,input,textarea')].filter(e=>{
      let r=e.getBoundingClientRect(),s=getComputedStyle(e);
      return s.display!=='none'&&s.visibility!=='hidden'&&r.width&&r.height&&r.top<innerHeight&&r.bottom>0&&(r.left < -1 ||r.right >innerWidth+1)
      }).map(e=>({id:e.id||e.textContent.slice(0,18),r:e.getBoundingClientRect().right}))}))()""")
    report['sizes'].append({'context':context,'requested':[wid,hgt],'measurement':m})
    chk(context+'_width_'+str(wid),m['width'],wid)
    chk(context+'_no_scroll_overflow_'+str(wid),m['scroll']<=wid+1)
    chk(context+'_no_controls_offscreen_'+str(wid),len(m['overflowing']),0)
    shot(context+f'_{wid}x{hgt}')
def where():return get('window.__A18_SCENE_STUDY__.state().galleryIndex')
def level():return get('window.__A18_SCENE_STUDY__.state().museumLevel')
def scene(to,direction=None):
    arg='' if direction is None else ',{arrivalFrom:'+json.dumps(direction)+'}'
    for _ in range(20):
        if get('window.__A18_SCENE_STUDY__.changeScene('+str(to)+arg+')'):return
        time.sleep(.15)
    raise AssertionError(f'scene {to} refused')
def route(dst):
    now=where()
    if now==dst:return
    links=get('window.__A18_SCENE_STUDY__.state().allRoomLinks')
    todo=[(now,[])];visited={now}
    while todo:
        pos,steps=todo.pop(0)
        if pos==dst:
            for n in steps:scene(n)
            chk('arrive_room_'+str(dst),where(),dst)
            return
        for new in links[str(pos)].values():
            if new<level() and new not in visited:
                visited.add(new);todo.append((new,steps+[new]))
    raise AssertionError(f'route impossible {now}->{dst}')
def evidence():
    return get("""(async()=>{let s=await A18P2Store.load();return JSON.stringify(await Promise.all(s.works.map(async w=>({
    id:w.id,fixture:w.fixtureId,notes:w.notes,shape:w.preferredShape,
    bytes:w.originalBlob.size,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await w.originalBlob.arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join('')
    }))))})()""")
def registration(room,n):
    title=f'P7-SYNTHETIC-{room}-{n}'
    get('window.__A18_SCENE_STUDY__.form()')
    chk('photo_field_'+title,get("!!document.getElementById('photo')"))
    width,height=[(220,130),(130,220),(160,160)][n%3]
    # Use a real browser File object assigned to the actual file input; do not invoke game internals to fabricate a work.
    get("""(()=>{let c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;
      let x=c.getContext('2d');x.fillStyle='#7d9f95';x.fillRect(0,0,c.width,c.height);
      x.fillStyle='#fff9d2';x.fillRect(8,8,c.width-16,c.height-16);
      document.getElementById('name').value=TITLE;
      document.getElementById('notes').value='P7 synthetic photo';
      document.getElementById('pieces').value='100';
      c.toBlob(blob=>{let dt=new DataTransfer();dt.items.add(new File([blob],'P7-test.png',{type:'image/png'}));
      document.getElementById('photo').files=dt.files;document.getElementById('save').click();},'image/png');
      return true})()""".replace('WIDTH',str(width)).replace('HEIGHT',str(height)).replace('TITLE',json.dumps(title)))
    chk('offer_'+title,wait("!!document.getElementById('offerNo')"))
    get("document.getElementById('offerNo').click()")
    chk('receive_'+title,wait("!!document.getElementById('receiveWork')",18))
    get("document.getElementById('receiveWork').click()")
    chk('carrying_'+title,wait("!!window.__A18_SCENE_STUDY__.state().carrying"))
    wid=get('window.__A18_SCENE_STUDY__.state().carrying')
    slot=n if room==0 else 5+(room-1)*5+n
    get(f'window.__A18_SCENE_STUDY__.inspect({slot})')
    chk('exhibited_'+title,wait('window.__A18_SCENE_STUDY__.state().works.some(w=>w.id=='+json.dumps(wid)+'&&w.fixtureId=='+json.dumps(f'frame-{room}-{n}')+')',15))
    return wid
def full_level_pictures(lv):
    current=where()
    for wid,hei in [(390,844),(375,812),(320,844)]:size(wid,hei,f'level{lv}_room{current}')
    w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
    for i in range(lv):
        route(i);shot(f'level{lv}_room{i}_390x844')
    route(current)
def dpad_step(direction):
    key={'east':'right','west':'left','north':'up','south':'down'}[direction]
    box=get("""(()=>{let b=document.querySelector('[data-d="DIRECTION"]');let r=b.getBoundingClientRect();
      let x=Math.round(r.left+r.width/2),y=Math.round(r.top+r.height/2);
      return {x,y,hit:document.elementFromPoint(x,y)?.closest('[data-d]')?.dataset.d||null}})()""".replace('DIRECTION',key))
    chk('dpad_center_hit_'+str(len(report['dpad'])),box['hit'],key)
    p={'x':box['x'],'y':box['y']}
    w.call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[p]})
    time.sleep(.92)
    w.call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
def all_dpad():
    links=get('window.__A18_SCENE_STUDY__.state().allRoomLinks')
    chk('14_dpad_directions',sum(map(len,links.values())),14)
    for wid,hei in [(390,844),(375,812),(320,844)]:
        w.call('Emulation.setDeviceMetricsOverride',{'width':wid,'height':hei,'deviceScaleFactor':1,'mobile':True})
        w.call('Emulation.setTouchEmulationEnabled',{'enabled':True,'maxTouchPoints':1})
        for src,edges in links.items():
            for direction,target in edges.items():
                route(target);scene(int(src),direction)
                t=time.monotonic();dpad_step(direction)
                arrived=wait('window.__A18_SCENE_STUDY__.state().galleryIndex==='+str(target),2.1)
                item={'size':[wid,hei],'source':int(src),'direction':direction,'target':target,
                      'arrived':arrived,'elapsed_ms':round((time.monotonic()-t)*1000)}
                report['dpad'].append(item)
                chk(f'dpad_{wid}_{src}_{direction}_{target}',arrived)
                if int(src)==5 and direction=='east':shot(f'重点_06to05_{wid}x{hei}')
def persist_state():
    return get("""(async()=>{let s=await A18P2Store.load();return JSON.stringify({
    rev:s.revision,level:s.progression.unlockedThroughLevel,room:s.galleryIndex,pos:s.pos,
    works:s.works.length,events:s.progression.events,notices:s.progression.newRoomNotices})})()""")
def run():
    global w,chrome
    with TemporaryDirectory(prefix='A18-P7A-synthetic-profile-',ignore_cleanup_errors=True) as profile:
        chrome=launch(profile,9921);w=attach(9921)
        w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
        w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
        w.call('Page.navigate',{'url':url})
        chk('first_boot_ready',wait('Boolean(window.__A18_SCENE_STUDY__?.ready())',18))
        chk('first_boot_level',level(),1)
        chk('first_boot_works',len(get('window.__A18_SCENE_STUDY__.state().works')),0)
        shot('Lv1_first_boot')
        get("document.getElementById('introSkipOpening').click()")
        get("document.getElementById('a18PlayerName').value='P7 Synthetic';document.getElementById('a18MuseumTitle').value='P7 QA';document.getElementById('confirmName').click()")
        chk('profile_saved',wait("window.__A18_SCENE_STUDY__.state().playerName==='P7 Synthetic'"))
        get("document.getElementById('startTour').click()")
        chk('intro_seen',wait("(async()=>{let s=await A18P2Store.load();return s.progression.events[0].status==='seen'})()"))
        full_level_pictures(1)
        events=['lv2-v1','lv3-v1','lv4-v1','lv5-v1','lv6-v1','gallery06-complete-v1']
        for room in range(6):
            route(room)
            for n in range(3 if room==0 else 5):
                registration(room,n)
            chk('event_popup_'+events[room],wait('!!document.getElementById("p2EventFinish")',16))
            shot('event_'+events[room])
            get('document.getElementById("p2EventFinish").click()')
            chk('event_seen_'+events[room],wait('(async()=>{let s=await A18P2Store.load();return s.progression.events.find(e=>e.id=='+json.dumps(events[room])+').status==="seen"})()',10))
            report['events'].append(events[room])
            chk('level_after_room_'+str(room),level(),min(room+2,6))
            full_level_pictures(min(room+2,6))
            before=evidence()
            w.call('Page.reload',{'ignoreCache':True})
            chk('reload_ready_'+str(room),wait('Boolean(window.__A18_SCENE_STUDY__?.ready())',18))
            chk('original_blob_sha_restore_'+str(room),evidence(),before)
        chk('28_work_count',len(get('window.__A18_SCENE_STUDY__.state().works')),28)
        chk('all_7_events',get('(async()=>{let s=await A18P2Store.load();return s.progression.events.filter(e=>e.status==="seen").length})()'),7)
        originals=evidence()
        all_dpad()
        w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
        chk('all_navigation_preserves_blob',evidence(),originals)
        route(0)
        get('window.__A18_SCENE_STUDY__.inspect(0)')
        chk('inspect_photo',get("!!document.getElementById('inspectPhoto')"))
        get("document.getElementById('editNote').click()")
        get("document.getElementById('editMemo').value='P7 edit verified';document.getElementById('saveMemo').click()")
        chk('memo_change',wait("window.__A18_SCENE_STUDY__.state().works.some(w=>w.notes==='P7 edit verified')"))
        get("document.getElementById('inspectPhoto').click()")
        shot('viewer_fullphoto')
        # Close through the documented viewer API or escape key.
        get("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
        if not get("!!document.getElementById('lift')"):
            get('window.__A18_SCENE_STUDY__.inspect(0)')
        get("document.getElementById('lift').click()")
        chk('photo_lift',wait("!!window.__A18_SCENE_STUDY__.state().carrying"))
        lifted=get('window.__A18_SCENE_STUDY__.state().carrying')
        get('window.__A18_SCENE_STUDY__.inspect(1)')
        chk('photo_swap',wait('window.__A18_SCENE_STUDY__.state().carrying!=='+json.dumps(lifted)+' && window.__A18_SCENE_STUDY__.state().carrying!==null',12))
        time.sleep(.25)
        get("document.getElementById('cancel').click()")
        stored=wait("window.__A18_SCENE_STUDY__.state().carrying===null",5)
        if not stored:
            report['storeDiagnostic'] = get("(()=>({state:window.__A18_SCENE_STUDY__.state(),storage:window.__A18_SCENE_STUDY__.storage(),hint:document.getElementById('hint')?.textContent,overlay:document.getElementById('overlay')?.hidden,cancelButton:!!document.getElementById('cancel')}))()")
            shot('photo_store_failure_diagnostic')
        report['checks'].append({'name':'photo_store','pass':stored,'actual':stored,'expected':True})
        chk('level_not_rolled_back',level(),6)
        get('window.__A18_SCENE_STUDY__.list()')
        chk('28_delete_options',get("document.querySelectorAll('[data-delete-work]').length"),28)
        get("document.querySelector('[data-delete-work]').click()")
        chk('delete_confirmation',get("!!document.getElementById('confirmDelete')"))
        get("document.getElementById('confirmDelete').click()")
        chk('one_work_deleted',wait("window.__A18_SCENE_STUDY__.state().works.length===27"))
        chk('level_still6_after_delete',level(),6)
        get('window.__A18_SCENE_STUDY__.showStoryHistory()')
        chk('7_story_replay_entries',get("document.querySelectorAll('[data-p6-replay]').length"),7)
        shot('story_history_all7')
        get('document.querySelector("[data-p6-replay=\'gallery06-complete-v1\']").click()')
        chk('replay_final_story',get("!!document.querySelector('.p6-story-chat')"))
        shot('final_story_replay')
        get("document.getElementById('p2EventFinish').click()")
        expected=persist_state()
        w.call('Page.reload',{'ignoreCache':True})
        chk('persist_reload_ready',wait('Boolean(window.__A18_SCENE_STUDY__?.ready())',18))
        chk('persist_reload_complete',persist_state(),expected)
        subprocess.run(['taskkill','/F','/T','/PID',str(chrome.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        chrome=None
        time.sleep(.5)
        chrome=launch(profile,9922);w=attach(9922)
        w.call('Page.enable');w.call('Runtime.enable')
        w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
        w.call('Page.navigate',{'url':url})
        chk('chrome_restart_ready',wait('Boolean(window.__A18_SCENE_STUDY__?.ready())',20))
        chk('chrome_restart_restore_all',persist_state(),expected)
        shot('real_chrome_process_restart')
        report['exceptions']=[x for x in w.console if x.get('method')=='Runtime.exceptionThrown']
        chk('zero_restart_exceptions',len(report['exceptions']),0)
try:
    run()
except Exception as exc:
    report['failures'].append({'exception':repr(exc),'traceback':traceback.format_exc()})
    print('FAIL',repr(exc),flush=True)
finally:
    if chrome:
        subprocess.run(['taskkill','/F','/T','/PID',str(chrome.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    http.shutdown()
    report['failed_count']=len(report['failures'])+sum(not c['pass'] for c in report['checks'])
    report['passed_count']=sum(c['pass'] for c in report['checks'])
    report['total_count']=len(report['checks'])
    report['status']='PASS' if not report['failed_count'] else 'FAIL'
    (OUT/'p7a_real_chrome_e2e.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print('RESULT',report['status'],report['passed_count'],report['total_count'],'shots',len(report['shots']),'directions',len(report['dpad']),flush=True)
    if report['failed_count']:raise SystemExit(1)
