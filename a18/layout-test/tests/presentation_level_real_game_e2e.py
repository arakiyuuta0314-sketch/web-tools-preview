"""A18 non-QA user-facing museum access setting.

Tests legacy v3 compatibility, first-run Lv6 choice, no story event or level
mutations, persistence, room travel, safely lowering in gallery5, auto mode,
and invalid config fail-fast. Screenshots captured from actual game.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(r"C:\Users\User\source\repos\web-tools-preview-a18-gallery-display-names-20261028")
OUT=ROOT/"a18/layout-test/tests/presentation-level-e2e"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel="chrome",headless=True)
  for width,height in ((844,390),(390,844)):
   context=browser.new_context(viewport={"width":width,"height":height},is_mobile=True,has_touch=True)
   page=context.new_page()
   errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
   page.goto(f"http://127.0.0.1:{server.server_port}/a18/layout-test/index.html",wait_until="domcontentloaded")
   page.locator("#a18OpeningStart").click()
   page.locator("#a18OpeningSkip").click()
   assert page.locator("#presentationLevel").count()==1, "initial profile level selector missing"
   assert page.locator("#presentationLevel").input_value()=="auto"
   assert page.locator("#testMuseumLevel").count()==0
   page.locator("#a18PlayerName").fill("設定QA")
   page.locator("#presentationLevel").select_option("6")
   page.screenshot(path=str(OUT/f"onboarding_{width}.png"))
   page.locator("#confirmName").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__?.ready()===true")
   state=page.evaluate("window.__A18_SCENE_STUDY__.state()")
   assert not page.evaluate("window.A18P2Store.TEST_MODE")
   assert state["museumLevel"]==1 and state["publicLevel"]==6 and state["presentationLevel"]==6,state
   baseline=page.evaluate("""async()=>{
     const save=await window.A18P2Store.load();
     return {progression:JSON.stringify(save.progression),revision:save.revision,works:save.works.length};
   }""")
   assert baseline["works"]==0
   assert page.evaluate("""()=>window.A18Navigation.mapHTML(0,{unlockedThroughLevel:6,storyUnlockedThroughLevel:1,newRoomNotices:[]}).includes("公開設定で利用可能")""")
   if page.locator("#skipTour").count() and page.locator("#skipTour").is_visible():page.locator("#skipTour").click()
   if page.locator("#overlay").is_visible():page.evaluate("document.getElementById('overlay').click()")
   print("SETTINGS INITIAL",width,flush=True)
   page.locator("#settingsGear").click(force=True)
   assert page.locator("#presentationLevel").input_value()=="6"
   assert page.locator("#testMuseumLevel").count()==0
   page.screenshot(path=str(OUT/f"settings_{width}.png"))
   page.locator("#applyPresentationLevel").click()
   page.wait_for_function("!document.querySelector('#overlay') || document.querySelector('#overlay').hidden")
   # Link gating uses presentation only; storyboard remains story Lv.1.
   for src,dir,target in [
     (0,"west",1),(1,"north",3),(3,"east",5),(5,"east",4),
     (4,"south",2),(2,"west",0),(0,"east",2),(2,"north",4),
     (4,"west",5),(5,"west",3),(3,"south",1),(1,"east",0),
     (0,"north",5),(5,"south",0)]:
     current=page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")
     assert current==src,(current,src)
     assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.target,{direction:v.dir})",{"target":target,"dir":dir})
     assert page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")==target
   after=page.evaluate("""async()=>{
     const s=await window.A18P2Store.load();
     return {progression:JSON.stringify(s.progression),presentation:s.presentationLevel,revision:s.revision,works:s.works.length};
   }""")
   assert after["progression"]==baseline["progression"],"Story changed during room trips!"
   assert after["presentation"]==6 and after["revision"]>baseline["revision"]
   page.reload(wait_until="domcontentloaded")
   page.wait_for_function("window.__A18_SCENE_STUDY__?.ready()===true")
   assert page.evaluate("window.__A18_SCENE_STUDY__.state().publicLevel")==6
   assert page.evaluate("window.__A18_SCENE_STUDY__.state().museumLevel")==1
   # The intro scene can reopen after reloading an in-progress first-run story.
   # Dismiss it through normal UI without changing events or save data.
   if page.locator("#a18OpeningStart").count() and page.locator("#a18OpeningStart").is_visible():page.locator("#a18OpeningStart").click()
   if page.locator("#a18OpeningSkip").count() and page.locator("#a18OpeningSkip").is_visible():page.locator("#a18OpeningSkip").click()
   if page.locator("#skipTour").count() and page.locator("#skipTour").is_visible():page.locator("#skipTour").click()
   if page.locator("#overlay").is_visible():page.evaluate("document.getElementById('overlay').click()")
   # Lower while in gallery5: return to entrance, but no story changes.
   assert page.evaluate("window.__A18_SCENE_STUDY__.changeScene(5,{direction:'north'})")
   print("SETTINGS DOWNGRADE",width,flush=True)
   page.locator("#settingsGear").click(force=True)
   assert page.locator("#presentationLevel").count()==1, "Settings blocked: "+str(page.evaluate("({opening:!document.querySelector('#a18OpeningRoot').hidden,overlay:!document.querySelector('#overlay').hidden})"))
   page.locator("#presentationLevel").select_option("2")
   page.locator("#applyPresentationLevel").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__.state().publicLevel===2")
   state=page.evaluate("window.__A18_SCENE_STUDY__.state()")
   assert state["galleryIndex"]==0 and state["museumLevel"]==1 and state["presentationLevel"]==2,state
   assert not page.evaluate("window.__A18_SCENE_STUDY__.changeScene(5,{direction:'north'})")
   # Automatic mode follows STORY progress only.
   print("SETTINGS AUTO",width,flush=True)
   page.locator("#settingsGear").click(force=True)
   page.locator("#presentationLevel").select_option("auto")
   page.locator("#applyPresentationLevel").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__.state().publicLevel===1")
   assert page.evaluate("window.__A18_SCENE_STUDY__.state().presentationLevel")==None
   after=page.evaluate("""async()=>JSON.stringify((await window.A18P2Store.load()).progression)""")
   assert after==baseline["progression"],"Autoselection mutated story!"
   # Backward compatibility: older valid saves lacking optional field.
   original=page.evaluate("""async()=>{
     const P=window.A18P2Store,save=await P.load();
     const previous=structuredClone(save);delete previous.presentationLevel;
     P.validate(previous);
     return {level:P.accessLevel(previous),revision:previous.revision};
   }""")
   assert original["level"]==1
   assert page.evaluate("""()=>window.A18P2Store.accessLevel({progression:{unlockedThroughLevel:4},presentationLevel:2})===4"""),"Story-unlocked areas must remain accessible when visual level is lowered"
   # Resetting works must retain user-facing presentation choice; full reset
   # returns the optional preference to its default automatic mode.
   persisted=page.evaluate("""async()=>{
     const P=window.A18P2Store,s=await P.load();
     return {onlyWorks:P.resetState(s,'works').presentationLevel,
             full:P.resetState(s,'all').presentationLevel};
   }""")
   assert persisted=={"onlyWorks":None,"full":None},persisted
   assert page.evaluate("""async()=>{
    const s=await window.A18P2Store.load();
    s.presentationLevel=7;
    try{window.A18P2Store.validate(s);return false}catch(e){return e.code==='E_PRESENTATION_LEVEL_INVALID'}
   }""")
   assert not errors,errors
   print(f"PASS {width}: first launch Lv6; 14 real room transitions; no story mutation; save reload; Lv2 downgrade; auto; legacy save validation")
   context.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
