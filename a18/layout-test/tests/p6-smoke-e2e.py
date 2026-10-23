"""P6 isolated Chrome CDP E2E, all photos synthetic; root is the P6 worktree."""
import json,time,tempfile,subprocess,traceback
from pathlib import Path
ROOT=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\11_P3_全館美術統合実装\qa_runtime')
ROOT.mkdir(parents=True,exist_ok=True)
namespace={}
lib=Path(__file__).with_name('p4-p2-regression-e2e.py').read_text('utf-8').split('all_results=[];failure=None')[0]
exec(lib,namespace)
WS,Runner,launch,attach,step_image=[namespace[k] for k in ('WS','Runner','launch','attach','step_image')]
URL='http://127.0.0.1:8991/layout-test/index.html?p2-e2e=1'
tests=[];errors=[]
def snap(w,name):
 import base64
 pixels=w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']
 (ROOT/name).write_bytes(base64.b64decode(pixels))
def value(w,expr):return w.ev(expr)
def assert_case(r,name,expr,expected=True):r.check(name,expr,expected)
def identity():
 return """(async()=>{let s=window.__A18_SCENE_STUDY__.p2.persistent();
 const works=await Promise.all(s.works.map(async w=>({id:w.id,fixtureId:w.fixtureId,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await w.originalBlob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('')})));
 return JSON.stringify({level:s.progression.unlockedThroughLevel,notices:s.progression.newRoomNotices,awards:s.progression.awardedRoomIds,fixtures:s.fixtures,works,room:s.galleryIndex,carrying:s.carrying});})()"""
try:
 with tempfile.TemporaryDirectory(prefix='a18-p6-profile-',ignore_cleanup_errors=True) as profile:
  proc=launch(profile,9676)
  try:
   w=attach(9676)
   w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
   w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
   w.call('Page.navigate',{'url':URL});w.ready();r=Runner(w)
   assert_case(r,'boot_intro_queued',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events[0].id",'intro-v1')
   assert_case(r,'boot_opening_shown',"Boolean(document.getElementById('introSkipOpening'))")
   assert_case(r,'boot_no_profile_form',"Boolean(document.getElementById('confirmName'))",False)
   snap(w,'P6_01_opening_390x844.png')
   w.ev("document.getElementById('introNext').click()")
   assert_case(r,'opening_second_line',"document.querySelector('.rpg-message').textContent", 'ここは、あなたの『とっておき』を飾る、小さな美術館でございます。')
   w.ev("document.getElementById('introSkipOpening').click()")
   assert_case(r,'skip_requires_profile',"Boolean(document.getElementById('confirmName'))")
   snap(w,'P6_02_required_profile_390x844.png')
   w.ev("document.getElementById('a18PlayerName').value='';document.getElementById('confirmName').click()")
   assert_case(r,'blank_profile_blocks',"document.getElementById('profileError').textContent.length>0")
   w.ev("document.getElementById('a18PlayerName').value='P6館長';document.getElementById('a18PlayerGender').value='female';document.getElementById('a18MuseumTitle').value='とっておき展示館';document.getElementById('confirmName').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().playerName==='P6館長'")
   assert_case(r,'profile_female',"window.__A18_SCENE_STUDY__.state().avatarGender",'female')
   assert_case(r,'intro_post_profile',"Boolean(document.getElementById('startTour'))")
   assert_case(r,'honorific_after_save',"document.querySelector('.rpg-message').textContent.includes('お嬢様')")
   snap(w,'P6_03_registration_guidance_390x844.png')
   w.ev("document.getElementById('introNext').click()")
   assert_case(r,'registration_help',"document.querySelector('.rpg-message').textContent.includes('話しかける')")
   w.ev("document.getElementById('skipTour').click()")
   w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events[0].status==='available'")
   assert_case(r,'intro_available_after_skip',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events[0].status",'available')
   w.call('Page.reload',{'ignoreCache':True});w.ready()
   assert_case(r,'intro_no_autoreplay',"Boolean(document.getElementById('introSkipOpening'))",False)
   w.ev("window.__A18_SCENE_STUDY__.showSettings()")
   assert_case(r,'settings_story_button',"Boolean(document.getElementById('p6StoryHistory'))")
   w.ev("document.getElementById('p6StoryHistory').click()")
   assert_case(r,'history_available_label',"document.querySelector('.p6-story-entry small').textContent",'あとで読む')
   snap(w,'P6_04_history_available_390x844.png')
   fingerprint=value(w,identity())
   w.ev("document.querySelector('[data-p6-replay=\"intro-v1\"]').click()")
   assert_case(r,'history_intro_without_form',"Boolean(document.getElementById('confirmName'))",False)
   assert_case(r,'history_uses_canonical_actor',"document.querySelector('.p6-story-chat img').getAttribute('src').length>0")
   w.ev("document.getElementById('introSkipOpening').click()") if value(w,"Boolean(document.getElementById('introSkipOpening'))") else None
   # In replay intro, showProgressionEvent reuses opening (existing path); verify no mandatory profile is shown and navigate via history below.
   assert_case(r,'replay_no_profile_prompt',"Boolean(document.getElementById('confirmName'))",False)
   tests.extend(r.results)
   print('P6_SMOKE',len(r.results), 'PASS', flush=True)
  finally:
   subprocess.run(['taskkill','/F','/T','/PID',str(proc.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
except Exception as e:
 errors.append(str(e));traceback.print_exc()
(ROOT/'p6_smoke_results.json').write_text(json.dumps({'assertions':tests,'errors':errors},ensure_ascii=False,indent=2),'utf-8')
if errors:raise SystemExit(1)
