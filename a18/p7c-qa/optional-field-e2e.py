"""P7-C: actual UI optional-field registration, restore, invalid-input, SHA and viewer QA."""
from pathlib import Path
from tempfile import TemporaryDirectory
import base64, hashlib, json, subprocess, time, traceback
lib=Path(__file__).resolve().parents[1]/'layout-test/tests/v3-release/run_browser.py'
ns={'__file__':str(lib)}
exec(lib.read_text('utf8').split('try:\n for run in (1,2):')[0],ns)
launch,attach,http,url=ns['launch'],ns['attach'],ns['http'],ns['game']
out=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\20_P7C_任意項目修正・Web配布統合\optional_fields')
out.mkdir(parents=True,exist_ok=True)
report={'cases':[],'failures':[],'screenshots':[],'isolatedProfiles':True,'syntheticImages':True}
def step(label,ok,detail=None):
    report['cases'].append({'name':label,'pass':bool(ok),'detail':detail})
    if not ok:raise AssertionError(label+' '+repr(detail))
def wait(w,expr,seconds=12):
    deadline=time.monotonic()+seconds
    while time.monotonic()<deadline:
        if w.ev(expr):return True
        time.sleep(.12)
    return False
def screenshot(w,name):
    data=base64.b64decode(w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'])
    (out/(name+'.png')).write_bytes(data)
    report['screenshots'].append({'name':name+'.png','sha256':hashlib.sha256(data).hexdigest()})
def mode_case(mode,port):
    chrome=None
    with TemporaryDirectory(prefix='a18-p7c-'+mode+'-',ignore_cleanup_errors=True) as profile:
        try:
            chrome=launch(profile,port);w=attach(port)
            w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
            w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
            w.call('Page.navigate',{'url':url})
            step(mode+'_boot',wait(w,'Boolean(window.__A18_SCENE_STUDY__?.ready())',20))
            w.ev("document.getElementById('introSkipOpening').click()")
            w.ev("document.getElementById('a18PlayerName').value='P7C Synthetic';document.getElementById('confirmName').click()")
            step(mode+'_intro',wait(w,"!!document.getElementById('startTour')",8))
            w.ev("document.getElementById('startTour').click()")
            step(mode+'_intro_done',wait(w,"!document.getElementById('p2EventFinish')",8))
            w.ev('window.__A18_SCENE_STUDY__.form()')
            step(mode+'_date_blank_initially',w.ev("document.getElementById('date').value")=='' )
            if mode=='pieces_null':
                w.ev("document.getElementById('date').value='2026-10-23'")
                w.ev("document.getElementById('pieces').value=''")
                expect_p,expect_d=None,'2026-10-23'
            elif mode=='date_null':
                w.ev("document.getElementById('pieces').value='100';document.getElementById('dateToday').click();document.getElementById('dateClear').click()")
                expect_p,expect_d=100,None
                step(mode+'_unknown_button_clears',w.ev("document.getElementById('date').value")=='')
            elif mode=='both_null':
                w.ev("document.getElementById('pieces').value='';document.getElementById('dateClear').click()")
                expect_p,expect_d=None,None
            elif mode=='explicit':
                w.ev("document.getElementById('pieces').value='300';document.getElementById('date').value='2025-02-28'")
                expect_p,expect_d=300,'2025-02-28'
            elif mode=='today':
                w.ev("document.getElementById('pieces').value='500';document.getElementById('dateToday').click()")
                expect_p=500
                expect_d=w.ev("document.getElementById('date').value")
                step(mode+'_today_button_sets_date',bool(expect_d) and len(expect_d)==10,expect_d)
            elif mode in ('zero','negative'):
                w.ev("document.getElementById('pieces').value='"+('0' if mode=='zero' else '-3')+"'")
                expect_p=expect_d=None
            else:raise AssertionError(mode)
            w.ev("""(()=>{
             const c=document.createElement('canvas');c.width=160;c.height=160;
             const g=c.getContext('2d');g.fillStyle='#378f77';g.fillRect(0,0,160,160);
             g.fillStyle='#ffffff';g.fillRect(10,10,50,50);
             document.getElementById('name').value='P7C '+"""+json.dumps(mode)+""";
             c.toBlob(blob=>{const file=new File([blob],'p7c-synthetic.png',{type:'image/png'});
               const dt=new DataTransfer();dt.items.add(file);
               document.getElementById('photo').files=dt.files;
               document.getElementById('save').click()},'image/png');
             return true
            })()""")
            if mode in ('zero','negative'):
                step(mode+'_validation_error',wait(w,"!!document.getElementById('err')?.textContent",5))
                step(mode+'_no_offer',not bool(w.ev("document.getElementById('offerNo')")))
                step(mode+'_no_saved_work',w.ev("(async()=> (await A18P2Store.load()).works.length)()")==0)
                screenshot(w,mode+'_rejected_390x844')
                return
            step(mode+'_offer',wait(w,"!!document.getElementById('offerNo')",10))
            w.ev("document.getElementById('offerNo').click()")
            step(mode+'_registered',wait(w,"!!document.getElementById('receiveWork')",12))
            persisted=w.ev("""(async()=>{const s=await A18P2Store.load(),w=s.works[0];
              const buf=await w.originalBlob.arrayBuffer();
              const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',buf))].map(x=>x.toString(16).padStart(2,'0')).join('');
              return {db:A18P2Store.DATABASE,schema:s.schemaVersion,count:s.works.length,
                pieces:w.pieces,complete:w.complete,hash,blobBytes:w.originalBlob.size,rev:s.revision}})()""")
            step(mode+'_persisted',persisted['db']=='a18-totteoki-museum-v3' and persisted['schema']==3 and persisted['count']==1 and persisted['pieces']==expect_p and persisted['complete']==expect_d and persisted['blobBytes']>100,persisted)
            first_sha=persisted['hash']
            w.ev("document.getElementById('receiveWork').click()")
            w.call('Page.reload',{'ignoreCache':True})
            step(mode+'_reload_ready',wait(w,'Boolean(window.__A18_SCENE_STUDY__?.ready())',20))
            restored=w.ev("""(async()=>{const s=await A18P2Store.load(),w=s.works[0];
             const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await w.originalBlob.arrayBuffer()))]
              .map(x=>x.toString(16).padStart(2,'0')).join('');
             return {pieces:w.pieces,complete:w.complete,hash,count:s.works.length}})()""")
            step(mode+'_reload_fields_hash',restored['pieces']==expect_p and restored['complete']==expect_d and restored['hash']==first_sha and restored['count']==1,restored)
            opened=w.ev("""(async()=>{const s=await A18P2Store.load();const a=A18P2Store.hydrate(s.works)[0];
             A18Viewer.open({items:[{id:a.id,title:a.title,pieces:a.pieces,complete:a.complete,
              registered:a.registered,notes:a.notes,src:a.displaySrc||a.originalURL,originalSrc:a.originalURL}],
              selectedId:a.id});return A18Viewer.state()})()""")
            step(mode+'_viewer_open',opened['open'] and opened['count']==1,opened)
            detail=w.ev("document.getElementById('photoDetails').textContent")
            step(mode+'_viewer_date', ('完成日 '+(expect_d or '不明')) in detail,detail)
            step(mode+'_viewer_pieces', (str(expect_p)+'ピース' if expect_p is not None else 'ピース数未登録') in detail,detail)
            screenshot(w,mode+'_viewer_390x844')
            for width,height in [(375,812),(320,844)]:
                w.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':True})
                step(mode+'_viewer_width_'+str(width),w.ev('innerWidth')==width)
                screenshot(w,mode+'_viewer_'+str(width)+'x'+str(height))
            w.ev('A18Viewer.close()')
            w.ev('window.__A18_SCENE_STUDY__.list()')
            step(mode+'_list_title', 'P7C '+mode in w.ev("document.getElementById('dialog').innerText"))
            screenshot(w,mode+'_list_390x844')
            subprocess.run(['taskkill','/F','/T','/PID',str(chrome.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            chrome=None
            time.sleep(.3)
            chrome=launch(profile,port);w=attach(port)
            w.call('Page.enable');w.call('Runtime.enable')
            w.call('Page.navigate',{'url':url})
            step(mode+'_process_restart',wait(w,'Boolean(window.__A18_SCENE_STUDY__?.ready())',20))
            reloaded=w.ev("(async()=>{const s=await A18P2Store.load();return {count:s.works.length,pieces:s.works[0].pieces,complete:s.works[0].complete}})()")
            step(mode+'_process_restart_fields',reloaded=={'count':1,'pieces':expect_p,'complete':expect_d},reloaded)
            # Fail-fast: invalid and missing properties remain rejected at the persistence boundary.
            rejected=w.ev("""(async()=>{const s=await A18P2Store.load();
             const mods=[['zero',w=>w.pieces=0],['negative',w=>w.pieces=-1],
              ['NaN',w=>w.pieces=NaN],['Infinity',w=>w.pieces=Infinity],
              ['text',w=>w.pieces='abc'],['missingPieces',w=>delete w.pieces],
              ['badDateType',w=>w.complete=5],['missingDate',w=>delete w.complete],
              ['missingTitle',w=>delete w.title]];
             return mods.map(([name,fn])=>{const c=structuredClone(s);fn(c.works[0]);
              try{A18P2Store.validate(c);return {name,rejected:false}}
              catch(e){return {name,rejected:true,code:e.code}}})})()""")
            step(mode+'_invalid_storage_rejected',len(rejected)==9 and all(x['rejected'] for x in rejected),rejected)
        finally:
            if chrome:subprocess.run(['taskkill','/F','/T','/PID',str(chrome.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
    for i,mode in enumerate(('pieces_null','date_null','both_null','explicit','today','zero','negative')):
        try:
            mode_case(mode,9944)
            print('CASE',mode,'PASS',flush=True)
        except Exception as exc:
            report['failures'].append({'mode':mode,'error':repr(exc),'traceback':traceback.format_exc()})
            print('CASE',mode,'FAIL',repr(exc),flush=True)
finally:
    http.shutdown()
    report['passCount']=sum(x['pass'] for x in report['cases'])
    report['failureCount']=len(report['failures'])+sum(not x['pass'] for x in report['cases'])
    (out/'p7c_optional_fields_e2e.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print('RESULT',report['passCount'],report['failureCount'],flush=True)
    if report['failureCount']:raise SystemExit(1)
