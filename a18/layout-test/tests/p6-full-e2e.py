"""P6 expanded end-to-end: all events, history replay, atomic recovery, 28 synthetic works."""
from pathlib import Path
import json,tempfile,subprocess,traceback,base64
source=Path(__file__).parent/'p6_regression'/'p4-full-e2e.py'
prefix=source.read_text('utf-8').split("try:\n with tempfile.TemporaryDirectory")[0]
ns={'__file__':str(source)}
exec(prefix,ns)
WS,Runner,launch,attach,step_image=[ns[k] for k in ('WS','Runner','launch','attach','step_image')]
create_and_hang,navigate,digest_expr=[ns[k] for k in ('create_and_hang','navigate','digest_expr')]
ROOT,URL=ns['ROOT'],ns['URL']
DATA=json.loads(Path(__file__).parents[1].joinpath('p6-event-dialogue-v1.json').read_text('utf-8'))
assert len(DATA['events'])==7
results=[];failure=None
def capture(w,name):
 data=w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']
 (ROOT/name).write_bytes(base64.b64decode(data))
def invariant():
 return """(async()=>{const s=window.__A18_SCENE_STUDY__.p2.persistent();
 return JSON.stringify({room:s.galleryIndex,position:s.pos,level:s.progression.unlockedThroughLevel,
 awarded:s.progression.awardedRoomIds,notices:s.progression.newRoomNotices,
 carrying:s.carrying,fixtures:s.fixtures,works:await Promise.all(s.works.map(async x=>({
 id:x.id,title:x.title,fixtureId:x.fixtureId,notes:x.notes,
 bytes:x.originalBlob.size,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await x.originalBlob.arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join('')})))})})()"""
try:
 with tempfile.TemporaryDirectory(prefix='a18-p6-full-',ignore_cleanup_errors=True) as profile:
  proc=launch(profile,9687)
  try:
   w=attach(9687)
   w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
   w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
   w.call('Page.navigate',{'url':URL});w.ready()
   r=Runner(w)
   r.check('intro_queued',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events[0].status",'queued')
   w.ev("document.getElementById('introSkipOpening').click()")
   w.ev("document.getElementById('a18PlayerName').value='統合検証';document.getElementById('a18MuseumTitle').value='P6テスト館';document.getElementById('confirmName').click()")
   w.wait("Boolean(document.getElementById('startTour'))")
   w.ev("document.getElementById('startTour').click()")
   w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='intro-v1').status==='seen'")
   r.check('profile_persisted',"window.__A18_SCENE_STUDY__.state().museumTitle",'P6テスト館')
   expected=[x['eventId'] for x in DATA['events'][1:]]
   for room,id in enumerate(expected):
    r.check('room_ready_'+str(room),"window.__A18_SCENE_STUDY__.state().galleryIndex",room)
    for i in range(3 if room==0 else 5):create_and_hang(w,r,room,i)
    r.check('level_saved_before_dialog_'+id,"window.__A18_SCENE_STUDY__.state().museumLevel",min(6,room+2))
    r.check('queued_status_'+id,"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='"+id+"').status",'queued')
    r.check('story_portrait_'+id,"document.querySelector('.p6-story-chat img').naturalWidth>0")
    expected_line=DATA['events'][room+1]['lines'][0].replace('{playerStaffName}','統合検証さん').replace('{playerHonorific}','統合検証様')
    r.check('story_text_'+id,"document.querySelector('.rpg-message').textContent",expected_line)
    capture(w,'P6_'+id+'_first_390x844.png')
    r.check('story_next_'+id,"Boolean(document.getElementById('p6Next'))",True)
    w.ev("document.getElementById('p6Next').click()")
    r.check('second_line_'+id,"document.querySelector('.p6-story-meta').textContent.includes('2 / 2')",True)
    capture(w,'P6_'+id+'_last_390x844.png')
    # Reload while queued, must resume from first page without reissuing progression.
    if room==1:
     w.call('Page.reload',{'ignoreCache':True});w.ready()
     r.check('queued_reopened_'+id,"Boolean(document.getElementById('p2EventFinish'))")
     r.check('queued_unique_'+id,"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='"+id+"').length",1)
    if room==2:
     # Commit of the read marker fails, but the underlying unlocked door remains.
     w.ev("window.__A18_SCENE_STUDY__.p2.injectFault('abort')")
     w.ev("document.getElementById('p2EventFinish').click()")
     w.wait("window.__A18_SCENE_STUDY__.p2.blocked()")
     r.check('event_failure_still_queued',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='"+id+"').status",'queued')
     r.check('event_failure_recovery_action',"Boolean(document.getElementById('p6Reload'))",True)
     r.check('event_failure_still_unlocked',"window.__A18_SCENE_STUDY__.state().museumLevel",4)
     capture(w,'P6_event_save_failure_390x844.png')
     w.ev("document.getElementById('p6Reload').click()");w.ready()
     r.check('event_recovery_queued',"Boolean(document.getElementById('p2EventFinish'))")
    # Two skipped story entries remain in history; others become seen.
    act='skip' if room in (1,5) else 'finish'
    w.ev("document.getElementById('p2Event"+('Skip' if act=='skip' else 'Finish')+"').click()")
    wanted='available' if act=='skip' else 'seen'
    w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='"+id+"').status==='"+wanted+"'")
    r.check('narrative_state_'+id,"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='"+id+"').status",wanted)
    if room<5:
     navigate(w,r,room+1)
     r.check('new_persists_'+str(room+1),"window.__A18_SCENE_STUDY__.p2.persistent().progression.newRoomNotices.includes("+str(room+1)+")")
   r.check('all_28_frames',"window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length",28)
   r.check('seven_events',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length",7)
   r.check('no_level7',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   before=w.ev(invariant())
   w.ev("window.__A18_SCENE_STUDY__.showSettings();document.getElementById('p6StoryHistory').click()")
   r.check('history_seven',"document.querySelectorAll('[data-p6-replay]').length",7)
   capture(w,'P6_history_seven_events_390x844.png')
   w.ev("document.querySelector('[data-p6-replay=\"lv3-v1\"]').click()")
   r.check('replay_staff_portrait',"document.querySelector('.p6-story-chat img').getAttribute('src')===window.A18Art.manifest.staff.portraitPath")
   w.ev("document.getElementById('p2EventFinish').click()")
   w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='lv3-v1').status==='seen'")
   r.check('available_replay_no_work_effect',invariant(),before)
   w.ev("document.querySelector('[data-p6-replay=\"lv3-v1\"]').click()")
   revision=w.ev("window.__A18_SCENE_STUDY__.p2.persistent().revision")
   w.ev("document.getElementById('p2EventFinish').click()")
   r.check('seen_read_only_revision',"window.__A18_SCENE_STUDY__.p2.persistent().revision",revision)
   r.check('seen_replay_works_unchanged',invariant(),before)
   w.ev("document.querySelector('[data-p6-replay=\"gallery06-complete-v1\"]').click()")
   r.check('final_replay_real_script',"document.querySelector('.rpg-message').textContent.includes('展示室06も完成だよ')")
   capture(w,'P6_final_story_replay_390x844.png')
   w.ev("document.getElementById('p2EventFinish').click()")
   w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='gallery06-complete-v1').status==='seen'")
   r.check('final_only_six_rooms',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   r.check('final_originals_unchanged',invariant(),before)
   w.call('Page.reload',{'ignoreCache':True});w.ready()
   r.check('restart_no_double_dialogue',"Boolean(document.getElementById('p2EventFinish'))",False)
   r.check('restart_blob_hash',invariant(),before)
   r.check('screen_width_390',"document.documentElement.scrollWidth<=390",True)
   r.check('screen_text_wrap',"getComputedStyle(document.querySelector('.p6-story-entry')||document.body).overflowWrap==='anywhere' || document.documentElement.scrollWidth<=390",True)
   results=r.results
   print('P6 FULL PASS',len(results),'Runtime exceptions:',sum(x.get('method')=='Runtime.exceptionThrown' for x in w.console),flush=True)
   if any(x.get('method')=='Runtime.exceptionThrown' for x in w.console):raise AssertionError('runtime exception')
  finally:
   subprocess.run(['taskkill','/F','/T','/PID',str(proc.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
except Exception as e:
 failure=repr(e);traceback.print_exc()
(ROOT/'p6_full_e2e_results.json').write_text(json.dumps({'passed':len(results),'failure':failure,'assertions':results},ensure_ascii=False,indent=2),'utf-8')
print('P6 FINAL',len(results),'failure',failure,flush=True)
if failure:raise SystemExit(1)
