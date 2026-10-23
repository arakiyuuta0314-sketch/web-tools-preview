"""P7-B isolated release-build Chrome QA. Never uses the user's Chrome profile."""
import argparse, base64, json, hashlib, os, subprocess, tempfile, time, traceback, urllib.request
from pathlib import Path
from functools import partial
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--dist",required=True)
    ap.add_argument("--out",required=True)
    args=ap.parse_args()
    dist=Path(args.dist).resolve()
    out=Path(args.out).resolve()
    out.mkdir(exist_ok=True,parents=True)
    screenshots=out.parent/"スクリーンショット"
    screenshots.mkdir(exist_ok=True,parents=True)
    src=Path(__file__).resolve().parents[2]
    lib=src/"tests/p4-p2-regression-e2e.py"
    ns={"__file__":str(lib)}
    exec(lib.read_text("utf8").split("all_results=[];failure=None")[0],ns)
    launch,attach,WS=ns["launch"],ns["attach"],ns["WS"]
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*a):pass
    server=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(dist)))
    Thread(target=server.serve_forever,daemon=True).start()
    origin=f"http://127.0.0.1:{server.server_port}"
    game=origin+"/layout-test/index.html"
    records=[]
    report={"baseCommit":"01ba0c64a256d3fc92ba56ef9b519d6a50d8fe8e","build":"release",
      "isolatedTemporaryProfiles":True,"userChromeProfileTouched":False,
      "origin":origin,"sections":records,"browserIssues":[],"failures":[]}
    def check(name,actual,expected=True):
        ok=actual==expected
        records.append({"check":name,"pass":ok,"observed":actual if isinstance(actual,(str,int,float,bool,type(None),list,dict)) else repr(actual),
            "expected":expected})
        print(("PASS " if ok else "FAIL ")+name,flush=True)
        if not ok:raise AssertionError(f"{name}: {actual!r} != {expected!r}")
    def start(profile,port,size=(390,844)):
        chrome=launch(profile,port)
        w=attach(port)
        w.call("Page.enable")
        w.call("Runtime.enable")
        w.call("Log.enable")
        w.call("Network.enable")
        w.call("Emulation.setDeviceMetricsOverride",{"width":size[0],"height":size[1],"deviceScaleFactor":1,"mobile":True})
        net=[]
        original=w.recv
        def tracking():
            val=original()
            if val and val.get("method") in ("Network.responseReceived","Network.loadingFailed"):
                p=val.get("params",{})
                if val["method"]=="Network.responseReceived":
                    r=p.get("response",{})
                    net.append({"url":r.get("url"),"status":r.get("status"),"mime":r.get("mimeType")})
                elif p.get("errorText") not in ("net::ERR_ABORTED",):
                    net.append({"networkFailure":p.get("errorText")})
            return val
        w.recv=tracking
        return chrome,w,net
    def stop(chrome,w):
        try:w.s.close()
        except Exception:pass
        subprocess.run(["taskkill","/F","/T","/PID",str(chrome.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        try:chrome.wait(timeout=8)
        except Exception:pass
        time.sleep(.5)
    def nav(w,url=game,expect_ready=True):
        w.call("Page.navigate",{"url":url})
        if not expect_ready:return
        t=time.monotonic()
        while time.monotonic()-t<10:
            try:
                if w.ev("Boolean(window.__A18_SCENE_STUDY__?.ready())"):return
            except Exception:pass
            time.sleep(.15)
        raise TimeoutError("release game failed to become ready "+str(w.ev("document.getElementById('hint')?.textContent"))+" CONSOLE "+str(w.console[-8:])[:1500])
    def snap(w,name):
        data=w.call("Page.captureScreenshot",{"format":"png","captureBeyondViewport":False})["data"]
        (screenshots/name).write_bytes(base64.b64decode(data))
    def js(w,code):return w.ev(code)
    def wait(w,expr,sec=12):
        t=time.monotonic()
        while time.monotonic()-t<sec:
            try:
                if w.ev(expr):return True
            except Exception:pass
            time.sleep(.12)
        return False
    try:
      # Persistence lifecycle (including hard Chrome process termination + relaunch).
      with tempfile.TemporaryDirectory(prefix="A18-P7B-PERSIST-",ignore_cleanup_errors=True) as profile:
        chrome,w,network=start(profile,9931)
        try:
          nav(w)
          state=js(w,"window.__A18_SCENE_STUDY__.state()")
          check("release_first_boot_Lv1",state["museumLevel"],1)
          check("release_first_boot_empty",len(state["works"]),0)
          check("release_first_boot_room0",state["galleryIndex"],0)
          check("release_db_name",js(w,"window.A18P2Store.DATABASE"),"a18-totteoki-museum-v3")
          check("release_meta",js(w,"document.querySelector('meta[name=a18-build]').content"),"release")
          check("no_dev_reset_api",js(w,"typeof window.A18DevReset"),"undefined")
          check("no_fault_test_api",js(w,"!('setFault' in window.A18P2Store)&&!('testMode' in window.A18P2Store)"))
          check("portrait_viewport_width",state["viewport"]["portrait"])
          snap(w,"p7b_release_Lv1_390x844.png")
          # Actual profile controls, not a synthetic DB commit.
          check("intro_skip_available",js(w,"!!document.getElementById('introSkipOpening')"))
          js(w,"document.getElementById('introSkipOpening').click()")
          check("onboarding_profile_form",js(w,"!!document.getElementById('confirmName')"))
          js(w,"document.getElementById('a18PlayerName').value='P7B QA 館長';document.getElementById('a18MuseumTitle').value='P7B 試遊美術館';document.getElementById('confirmName').click()")
          check("profile_UI_saved",wait(w,"window.__A18_SCENE_STUDY__.state().playerName==='P7B QA 館長'"))
          js(w,"document.getElementById('startTour').click()")
          check("intro_UI_saved",wait(w,"(async()=>{const s=await A18P2Store.load();return s.progression.events[0].status==='seen'})()"))
          before=js(w,"(async()=>{const s=await A18P2Store.load();return {revision:s.revision,playerName:s.playerName,museumTitle:s.museumTitle,level:s.progression.unlockedThroughLevel}})()")
          snap(w,"p7b_release_Lv1_profile_390x844.png")
          w.call("Page.reload",{"ignoreCache":True});check("reload_ready",wait(w,"Boolean(window.__A18_SCENE_STUDY__?.ready())",20))
          after=js(w,"(async()=>{const s=await A18P2Store.load();return {revision:s.revision,playerName:s.playerName,museumTitle:s.museumTitle,level:s.progression.unlockedThroughLevel}})()")
          check("same_origin_reload_preserves_v3",after,before)
          check("all_fetched_assets_no_http_error",[x for x in network if x.get("status",200)>=400 and x.get("url","").startswith(origin)],[])
          check("no_browser_exceptions",len([x for x in w.console if x.get("method")=="Runtime.exceptionThrown"]),0)
          report["browserIssues"].extend(x for x in network if x.get("status",200)>=400 or x.get("networkFailure"))
        finally:stop(chrome,w)
        chrome,w,network=start(profile,9932)
        try:
          nav(w)
          after_restart=js(w,"(async()=>{const s=await A18P2Store.load();return {revision:s.revision,playerName:s.playerName,museumTitle:s.museumTitle,level:s.progression.unlockedThroughLevel}})()")
          check("chrome_process_restart_preserves_v3",after_restart,before)
          snap(w,"p7b_release_Lv1_Chrome_restarted_390x844.png")
          w.call("Emulation.setDeviceMetricsOverride",{"width":844,"height":390,"deviceScaleFactor":1,"mobile":True})
          time.sleep(.4)
          check("landscape_viewport",js(w,"window.__A18_SCENE_STUDY__.state().viewport.portrait"),False)
          snap(w,"p7b_release_Lv1_844x390.png")
          # Real second tab through Chrome CDP; both tabs share the same origin and IndexedDB.
          info=w.call("Target.createTarget",{"url":"about:blank"})
          pages=json.load(urllib.request.urlopen("http://127.0.0.1:9932/json",timeout=5))
          newpage=next(x for x in pages if x.get("id")==info["targetId"])
          w2=WS(newpage["webSocketDebuggerUrl"])
          w2.call("Page.enable");w2.call("Runtime.enable")
          nav(w2)
          check("second_tab_loaded_same_revision",js(w2,"(async()=> (await A18P2Store.load()).revision)()"),before["revision"])
          b=js(w2,"(async()=>{const p=A18P2Store;const old=await p.load();const next=p.copy(old);next.revision++;next.museumTitle='P7B 二番目のタブ';await p.commit(old.revision,next);return next.revision})()")
          check("second_tab_commit_increment",b,before["revision"]+1)
          js(w,"(async()=>{try{await window.__A18_SCENE_STUDY__.setAvatar('female')}catch(e){}return true})()")
          check("first_tab_blocks_on_stale_revision",js(w,"window.__A18_SCENE_STUDY__.storage().blocked"),True)
          check("second_tab_saved_value_not_overwritten",js(w,"(async()=> (await A18P2Store.load()).museumTitle)()"),"P7B 二番目のタブ")
          w2.s.close()
        finally:stop(chrome,w)
      # Browser-isolated legacy DB fixtures: must not be touched by release game.
      with tempfile.TemporaryDirectory(prefix="A18-P7B-LEGACY-",ignore_cleanup_errors=True) as profile:
        chrome,w,network=start(profile,9933)
        try:
          nav(w,origin+"/",False)
          seed=js(w,"""(async()=>{
            for(const name of ['a18-museum-layout-v2','a18-museum-p2-isolated-v3']){
              const q=indexedDB.open(name,1);
              const db=await new Promise((resolve,reject)=>{q.onupgradeneeded=()=>q.result.createObjectStore('states');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
              await new Promise((resolve,reject)=>{const tx=db.transaction('states','readwrite');tx.objectStore('states').put({sentinel:name+'-UNTOUCHED'},'museum');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});
              db.close();
            }
            return true
          })()""")
          check("seed_old_databases",seed)
          nav(w)
          check("old_data_does_not_prevent_new_Lv1",js(w,"window.__A18_SCENE_STUDY__.state().museumLevel"),1)
          unchanged=js(w,"""(async()=>{
            for(const name of ['a18-museum-layout-v2','a18-museum-p2-isolated-v3']){
              const q=indexedDB.open(name,1),db=await new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
              const value=await new Promise((resolve,reject)=>{const tx=db.transaction('states','readonly'),r=tx.objectStore('states').get('museum');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
              db.close();if(value?.sentinel!==name+'-UNTOUCHED')return false;
            }
            return true
          })()""")
          check("old_v2_and_dev_v3_records_unchanged",unchanged)
          check("no_migration",js(w,"(async()=> (await A18P2Store.load()).progression.migration)()"),None)
        finally:stop(chrome,w)
      # Corrupt key is not an empty slot. Verify stop and non-modification.
      with tempfile.TemporaryDirectory(prefix="A18-P7B-CORRUPT-",ignore_cleanup_errors=True) as profile:
        chrome,w,network=start(profile,9934)
        try:
          nav(w,origin+"/",False)
          check("seed_corrupt_null",js(w,"""(async()=>{const q=indexedDB.open('a18-totteoki-museum-v3',1);const db=await new Promise((resolve,reject)=>{q.onupgradeneeded=()=>q.result.createObjectStore('states');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});await new Promise((resolve,reject)=>{const t=db.transaction('states','readwrite');t.objectStore('states').put(null,'museum');t.oncomplete=resolve;t.onabort=()=>reject(t.error)});db.close();return true})()"""))
          nav(w,game,False)
          time.sleep(2.0)
          check("corrupt_null_stops_boot",js(w,"!window.__A18_SCENE_STUDY__?.ready()"))
          check("corrupt_null_load_rejected",js(w,"(async()=>{try{await A18P2Store.load();return false}catch(e){return e.code==='E_SCHEMA_UNKNOWN'}})()"))
          check("corrupt_null_preserved",js(w,"""(async()=>{const q=indexedDB.open('a18-totteoki-museum-v3',1);const db=await new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});const value=await new Promise((resolve,reject)=>{const t=db.transaction('states','readonly'),r=t.objectStore('states').get('museum'),k=t.objectStore('states').getKey('museum');t.oncomplete=()=>resolve({v:r.result,k:k.result});t.onabort=()=>reject(t.error)});db.close();return value.v===null&&value.k==='museum'})()"""))
          snap(w,"p7b_release_corrupt_stop_390x844.png")
        finally:stop(chrome,w)
      # Deterministic QuotaExceededError emulation, NOT a genuine exhausted disk/device test.
      with tempfile.TemporaryDirectory(prefix="A18-P7B-QUOTA-",ignore_cleanup_errors=True) as profile:
        chrome,w,network=start(profile,9935)
        try:
          nav(w)
          check("quota_baseline_ready",js(w,"window.__A18_SCENE_STUDY__.state().museumLevel"),1)
          res=js(w,"""(async()=>{
            const p=A18P2Store,before=await p.load(),next=p.copy(before);next.revision++;next.museumTitle='SHOULD-NOT-SAVE';
            const original=IDBObjectStore.prototype.put;
            IDBObjectStore.prototype.put=function(...args){if(this.name==='states'&&args[1]==='museum')throw new DOMException('synthetic full disk','QuotaExceededError');return original.apply(this,args)};
            let code='NO_ERROR';
            try{await p.commit(before.revision,next)}catch(e){code=e.code||e.name}
            finally{IDBObjectStore.prototype.put=original}
            const after=await p.load();
            return {code,sameRevision:before.revision===after.revision,sameTitle:before.museumTitle===after.museumTitle}
          })()""")
          check("quota_emulation_error_code",res["code"],"QuotaExceededError")
          check("quota_emulation_revision_unchanged",res["sameRevision"])
          check("quota_emulation_data_unchanged",res["sameTitle"])
        finally:stop(chrome,w)
      report["passed"]=True
    except Exception as e:
      report["passed"]=False
      report["failures"].append(repr(e))
      traceback.print_exc()
    finally:
      server.shutdown()
      report["checksPassed"]=sum(x["pass"] for x in records)
      report["checksTotal"]=len(records)
      (out/"browser_release_qa.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
      print("P7B BROWSER SUMMARY",json.dumps({k:report[k] for k in ("passed","checksPassed","checksTotal","failures")},ensure_ascii=False),flush=True)
    return 0 if report["passed"] else 1

if __name__=="__main__":raise SystemExit(main())
