"""P7-A independent Chrome UI check: skip -> available -> replay -> seen; NEW after first visit."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json,traceback,subprocess,time,base64
helper=Path(__file__).with_name('web-final-e2e.py')
ns={'__file__':str(helper)}
exec(helper.read_text(encoding='utf-8').split('try:\n    run()')[0],ns)
launch,attach,get,wait,registration=(*(ns[x] for x in ('launch','attach','get','wait','registration')),)
http=ns['http'];url=ns['url'];out=ns['OUT']
result={'checks':[],'screens':[],'failures':[]}
def check(name,actual,expected=True):
    ok=actual==expected
    result['checks'].append({'name':name,'pass':ok,'actual':actual,'expected':expected})
    if not ok:raise AssertionError(name+' actual '+repr(actual)+' expected '+repr(expected))
def status():
    return get("(async()=>{let s=await A18P2Store.load();return s.progression.events.find(e=>e.id==='lv2-v1')?.status})()")
def state():
    return get("(async()=>{let s=await A18P2Store.load();return {level:s.progression.unlockedThroughLevel,works:s.works.length,notice:[...s.progression.newRoomNotices],room:s.galleryIndex}})()")
def screenshot(name):
    path=out/(name+'.png')
    path.write_bytes(base64.b64decode(w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']))
    result['screens'].append(path.name)
w=None;process=None
try:
    with TemporaryDirectory(prefix='A18-P7A-STORY-SKIP-',ignore_cleanup_errors=True) as profile:
        process=launch(profile,9957);w=attach(9957);ns['w']=w
        w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
        w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
        w.call('Page.navigate',{'url':url})
        check('boot',wait('Boolean(window.__A18_SCENE_STUDY__?.ready())',18))
        get("document.getElementById('introSkipOpening').click()")
        get("document.getElementById('a18PlayerName').value='Story QA';document.getElementById('confirmName').click()")
        check('profile',wait("Boolean(document.getElementById('startTour'))"))
        get("document.getElementById('startTour').click()")
        check('intro_done',wait("(async()=>{let s=await A18P2Store.load();return s.progression.events[0].status==='seen'})()"))
        for i in range(3):registration(0,i)
        check('lv2_first',state()['level'],2)
        check('lv2_story_visible',wait("Boolean(document.getElementById('p2EventSkip'))"))
        screenshot('p7a_story_skip_button_before')
        get('document.getElementById("p2EventSkip").click()')
        check('skipped_available',wait("(async()=>{let s=await A18P2Store.load();return s.progression.events.find(e=>e.id==='lv2-v1').status==='available'})()",8))
        st=state()
        check('new_room_notice_added',1 in st['notice'])
        get('window.__A18_SCENE_STUDY__.showFloorMap()')
        check('new_tag_visible_before_visit',"NEW" in get("document.getElementById('dialog').innerText"))
        screenshot('p7a_NEW_before_first_visit')
        get('document.getElementById("closeFloorMap").click()')
        get('window.__A18_SCENE_STUDY__.changeScene(1)')
        check('room_1_entered',wait('window.__A18_SCENE_STUDY__.state().galleryIndex===1',8))
        result['newAfterFirstVisit']=state()['notice']
        result['newPersistedAfterFirstVisit']=1 in state()['notice']
        get('window.__A18_SCENE_STUDY__.changeScene(0)')
        check('returned_to_entrance_after_visit',wait('window.__A18_SCENE_STUDY__.state().galleryIndex===0',8))
        get('window.__A18_SCENE_STUDY__.showFloorMap()')
        result['newStillShownAfterFirstVisit']="NEW" in get("document.getElementById('dialog').innerText")
        screenshot('p7a_NEW_after_first_visit')
        get('document.getElementById("closeFloorMap").click()')
        get('window.__A18_SCENE_STUDY__.showStoryHistory()')
        check('story_available_in_history',get("!!document.querySelector('[data-p6-replay=\"lv2-v1\"]')"))
        screenshot('p7a_skipped_story_history')
        get('document.querySelector("[data-p6-replay=\\"lv2-v1\\"]").click()')
        check('read_skipped_story',get("!!document.getElementById('p2EventFinish')"))
        get('document.getElementById("p2EventFinish").click()')
        check('skipped_now_seen',wait("(async()=>{let s=await A18P2Store.load();return s.progression.events.find(e=>e.id==='lv2-v1').status==='seen'})()",8))
        check('level_stable',state()['level'],2)
        check('count_stable',state()['works'],3)
        w.call('Page.reload',{'ignoreCache':True})
        check('reload_ready',wait("Boolean(window.__A18_SCENE_STUDY__?.ready())"))
        check('seen_retained',status(),'seen')
        check('NEW_persisted_after_reload',1 in state()['notice'])
except Exception as error:
    result['failures'].append({'error':repr(error),'traceback':traceback.format_exc()})
    print('STORY FAIL',repr(error),flush=True)
finally:
    if process:subprocess.run(['taskkill','/F','/T','/PID',str(process.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    http.shutdown()
    result['failed_count']=len(result['failures'])+sum(not x['pass'] for x in result['checks'])
    result['passed_count']=sum(x['pass'] for x in result['checks'])
    result['total_count']=len(result['checks'])
    (out/'p7a_story_skip_new_e2e.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print('STORY',result['passed_count'],result['total_count'],'NEW remained',result.get('newPersistedAfterFirstVisit'),'fail',result['failed_count'],flush=True)
    if result['failed_count']:raise SystemExit(1)
