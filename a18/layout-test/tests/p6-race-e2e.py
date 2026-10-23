"""P6 story double-tap and two-tab event CAS fault, isolated profile."""
from pathlib import Path
import json,tempfile,subprocess,traceback,urllib.request,urllib.parse
ns={}
source=Path(__file__).parent/'p6_regression'/'p4-p2-regression-e2e.py'
exec(source.read_text('utf-8').split('all_results=[];failure=None')[0],ns)
WS,Runner,launch,attach,step_image=[ns[k] for k in ('WS','Runner','launch','attach','step_image')]
ROOT,URL=ns['ROOT'],ns['URL']
tests=[];error=None
def prep(w):
 w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
 w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
 w.call('Page.navigate',{'url':URL});w.ready()
try:
 with tempfile.TemporaryDirectory(prefix='a18-p6-two-tab-',ignore_cleanup_errors=True) as profile:
  proc=launch(profile,9688)
  try:
   a=attach(9688);prep(a);r=Runner(a)
   a.ev("document.getElementById('introSkipOpening').click();document.getElementById('a18PlayerName').value='CAS試験';document.getElementById('confirmName').click()")
   a.wait("Boolean(document.getElementById('startTour'))")
   a.ev("document.getElementById('startTour').click()")
   a.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events[0].status==='seen'")
   for i in range(3):
    assert step_image(a,'RACE-'+str(i))
    a.ev("window.__A18_SCENE_STUDY__.inspect("+str(i)+")")
    a.wait("window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length==="+str(i+1))
   r.check('level2_ready',"window.__A18_SCENE_STUDY__.state().museumLevel",2)
   r.check('still_queued',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='lv2-v1').status",'queued')
   a.ev("(()=>{const button=document.getElementById('p6Next');button.click();button.click()})()")
   r.check('double_next_bounds',"document.querySelector('.p6-story-meta').textContent.includes('2 / 2')",True)
   r.check('double_next_no_corruption',"document.querySelector('.rpg-message').textContent.length>0",True)
   url='http://127.0.0.1:9688/json/new?'+urllib.parse.quote(URL,safe='')
   b=WS(json.load(urllib.request.urlopen(urllib.request.Request(url,method='PUT'),timeout=8))['webSocketDebuggerUrl'])
   b.call('Page.enable');b.call('Runtime.enable');b.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True});b.ready()
   rr=Runner(b)
   r.check('two_tabs_same_revision',"window.__A18_SCENE_STUDY__.p2.persistent().revision",b.ev("window.__A18_SCENE_STUDY__.p2.persistent().revision"))
   revision=a.ev("window.__A18_SCENE_STUDY__.p2.persistent().revision")
   a.ev("(()=>{const done=document.getElementById('p2EventFinish');done.click();done.click()})()")
   a.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='lv2-v1').status==='seen'")
   r.check('one_revision_for_double_finish',"window.__A18_SCENE_STUDY__.p2.persistent().revision",revision+1)
   b.ev("document.getElementById('p2EventSkip').click()")
   b.wait("window.__A18_SCENE_STUDY__.p2.blocked()")
   rr.check('stale_tab_event_still_queued',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='lv2-v1').status",'queued')
   rr.check('database_winner_seen',"(async()=>{const s=await window.A18P2Store.load();return s.progression.events.find(e=>e.id==='lv2-v1').status})()",'seen')
   rr.check('unchanged_work_blobs',"(async()=>{const s=await window.A18P2Store.load();return s.works.length===3&&s.works.every(w=>w.originalBlob instanceof Blob)})()",True)
   b.call('Page.reload',{'ignoreCache':True});b.ready()
   rr.check('stale_tab_recovers',"Boolean(document.getElementById('p2EventFinish'))",False)
   rr.check('no_duplicate_level_event',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='lv2-v1').length",1)
   tests=r.results+rr.results
   print('P6 CAS PASS',len(tests),'runtime exceptions:',sum(x.get('method')=='Runtime.exceptionThrown' for x in a.console+b.console),flush=True)
   if any(x.get('method')=='Runtime.exceptionThrown' for x in a.console+b.console):raise AssertionError('JS exception')
  finally:
   subprocess.run(['taskkill','/F','/T','/PID',str(proc.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
except Exception as ex:
 error=repr(ex);traceback.print_exc()
(ROOT/'p6_race_e2e_results.json').write_text(json.dumps({'assertions':tests,'error':error},ensure_ascii=False,indent=2),'utf-8')
if error:raise SystemExit(1)
