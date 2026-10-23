"""Isolated Chrome reproduction: UI declares pieces optional, v3 validator rejects null."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json,subprocess,time,base64,traceback
from PIL import Image
lib=Path(__file__).resolve().parents[1]/'layout-test/tests/v3-release/run_browser.py'
ns={'__file__':str(lib)}
exec(lib.read_text('utf-8').split('try:\n for run in (1,2):')[0],ns)
launch,attach,http,url=ns['launch'],ns['attach'],ns['http'],ns['game']
out=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\20_P7C_任意項目修正・Web配布統合\pre_fix')
s={'purpose':'reproduce blank optional pieces rejected, formal v3, real photo input, isolated Chrome profile','checks':[],'errors':[]}
w=None;p=None
def js(x):return w.ev(x)
def wait(x,timeout=8):
    t=time.monotonic()
    while time.monotonic()-t<timeout:
        if js(x):return True
        time.sleep(.1)
    return False
try:
    with TemporaryDirectory(prefix='a18-blankpieces-repro-',ignore_cleanup_errors=True) as profile:
        p=launch(profile,9938);w=attach(9938)
        w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
        w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
        w.call('Page.navigate',{'url':url})
        assert wait('Boolean(window.__A18_SCENE_STUDY__?.ready())',18)
        js("document.getElementById('introSkipOpening').click()")
        js("document.getElementById('a18PlayerName').value='QA Test';document.getElementById('confirmName').click()")
        assert wait('Boolean(document.getElementById("startTour"))',8)
        js('document.getElementById("startTour").click()')
        assert wait('!document.getElementById("p2EventFinish")&&window.__A18_SCENE_STUDY__.state().playerName!=""',8)
        js('window.__A18_SCENE_STUDY__.form()')
        label=js("""document.getElementById('pieces').parentElement.textContent.trim()""")
        s['uiPiecesLabel']=label
        s['checks'].append({'name':'ui_marked_optional','pass':'任意' in label})
        js("""(()=>{const c=document.createElement('canvas');c.width=160;c.height=160;let g=c.getContext('2d');g.fillStyle='#387754';g.fillRect(0,0,160,160);
          document.getElementById('name').value='P7 Optional Field Test';
          document.getElementById('pieces').value='';
          c.toBlob(blob=>{let f=new File([blob],'P7-generated.png',{type:'image/png'}),dt=new DataTransfer();dt.items.add(f);
            document.getElementById('photo').files=dt.files;document.getElementById('save').click()},'image/png');
          return true})()""")
        assert wait("Boolean(document.getElementById('offerNo'))",8)
        js("document.getElementById('offerNo').click()")
        time.sleep(1.2)
        s['view']={'receiveWork':js("!!document.getElementById('receiveWork')"),
                   'dialogText':js("document.getElementById('dialog').innerText.slice(0,440)"),
                   'hint':js("document.getElementById('hint')?.textContent"),
                   'persistedWorks':js("(async()=>{let a=await A18P2Store.load();return a.works.length})()"),
                   'blocked':js("window.__A18_SCENE_STUDY__.storage().blocked")}
        img=base64.b64decode(w.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'])
        (out/'optional_pieces_repro_390x844.png').write_bytes(img)
        s['checks'].append({'name':'no_photo_was_committed','pass':s['view']['persistedWorks']==0})
        s['checks'].append({'name':'registration_success','pass':s['view']['receiveWork']})
        s['reproduced']=not s['view']['receiveWork'] and s['view']['persistedWorks']==0
        s['runtimeExceptions']=[x for x in w.console if x.get('method')=='Runtime.exceptionThrown']
except Exception as e:
    s['errors'].append({'error':repr(e),'traceback':traceback.format_exc()})
finally:
    if p:subprocess.run(['taskkill','/F','/T','/PID',str(p.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    http.shutdown()
    (out/'p7a_optional_pieces_repro.json').write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf-8')
    print('REPRODUCED',s.get('reproduced'),'VIEW',s.get('view'),'ERRORS',s['errors'],flush=True)
    if not s.get('reproduced'):raise SystemExit(1)
