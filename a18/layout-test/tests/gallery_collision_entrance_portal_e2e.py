"""A18 2026-10-31 temporary gallery open-floor and entrance alignment QA.
Real game, normal non-QA state. Story progress must remain unchanged.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(r"C:\Users\User\source\repos\web-tools-preview-a18-gallery-display-names-20261028")
Q=ROOT/"a18/layout-test/tests/entrance-frame-qa"
Q.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel="chrome",headless=True)
  for width,height in ((844,390),(390,844)):
   page=browser.new_page(viewport={"width":width,"height":height},is_mobile=True,has_touch=True)
   errors=[]
   page.on("pageerror",lambda e:errors.append(str(e)))
   page.goto(f"http://127.0.0.1:{server.server_port}/a18/layout-test/index.html",wait_until="domcontentloaded")
   page.locator("#a18OpeningStart").click();page.locator("#a18OpeningSkip").click()
   page.locator("#a18PlayerName").fill("通路QA")
   page.locator("#presentationLevel").select_option("6")
   page.locator("#confirmName").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__?.ready()===true")
   if page.locator("#skipTour").count() and page.locator("#skipTour").is_visible():page.locator("#skipTour").click()
   if page.locator("#overlay").is_visible():page.evaluate("document.querySelector('#overlay').click()")
   state=page.evaluate("window.__A18_SCENE_STUDY__.state()")
   assert state["galleryIndex"]==0 and state["publicLevel"]==6 and state["museumLevel"]==1
   # Initial entrance collision remains unchanged: the L-counter and its
   # partition physically block moving over its footprint.
   assert page.evaluate("window.__A18_SCENE_STUDY__.canMove(100,375)") is False
   assert page.evaluate("window.__A18_SCENE_STUDY__.canMove(326,425)") is True
   # The bottom edge of the entrance is NOT a corridor to another gallery.
   for i in range(9):page.evaluate("window.__A18_SCENE_STUDY__.move('down')")
   assert page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")==0
   # Walk along clear floor, align with rear top-door x~290, then north.
   for i in range(15):page.evaluate("window.__A18_SCENE_STUDY__.move('up')")
   for i in range(3):page.evaluate("window.__A18_SCENE_STUDY__.move('left')")
   p=page.evaluate("window.__A18_SCENE_STUDY__.state().pos")
   assert 265<p["x"]<307 and p["y"]>198,p
   for i in range(18):
    page.evaluate("window.__A18_SCENE_STUDY__.move('up')")
    if page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")==5:break
   page.wait_for_function("window.__A18_SCENE_STUDY__.state().galleryIndex===5",timeout=9000)
   print(f"PASS {width}: upper north entrance doorway is physically reachable, not bottom")
   # Approved architecture walls, gallery floor-mounted displays and
   # staff are now solid; obsolete pre-redraw P2 frame hitboxes are not reused.
   for room in range(1,6):
    while page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")!=0:
     current=page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")
     if current in (1,2,5):target={1:0,2:0,5:0}[current];direction={1:"east",2:"west",5:"south"}[current]
     else:target={3:1,4:2}[current];direction="south"
     assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.t,{direction:v.d})",{"t":target,"d":direction})
    if room in (1,2,5):
     direction={1:"west",2:"east",5:"north"}[room]
     assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.t,{direction:v.d})",{"t":room,"d":direction})
    else:
     mid={3:1,4:2}[room]
     direction="west" if mid==1 else "east"
     assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.t,{direction:v.d})",{"t":mid,"d":direction})
     assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.t,{direction:'north'})",{"t":room})
    state=page.evaluate("window.__A18_SCENE_STUDY__.state()")
    assert state["galleryIndex"]==room
    floor=page.evaluate("""(r)=>{
      const L=window.A18Layout,arr=L.obstacles(L.defaults(),r),staff=arr[0];
      return {obstacles:arr,art:L.DISPLAY_FOOTPRINTS[r],
        staffPoint:[(staff[0]+staff[1])/2,(staff[2]+staff[3])/2-5]};
    }""",room)
    assert len(state["obstacles"])==len(floor["art"])+1
    assert page.evaluate("(p)=>window.__A18_SCENE_STUDY__.canMove(p[0],p[1])",floor["staffPoint"]) is False
    for left,right,top,bottom in floor["art"]:
     assert page.evaluate("(p)=>window.__A18_SCENE_STUDY__.canMove(p[0],p[1])",
       [(left+right)/2,(top+bottom)/2-5]) is False
    assert page.evaluate("window.__A18_SCENE_STUDY__.canMove(295,110)") is False
    assert page.evaluate("window.__A18_SCENE_STUDY__.canMove(295,410)") is True
    assert page.evaluate("window.__A18_SCENE_STUDY__.canMove(10,200)") is False
    print(f"PASS {width}: gallery{room} architectural rear wall, {len(floor['art'])} displays, staff solid; open aisle and boundary correct")
   assert not errors,errors
   assert page.evaluate("window.__A18_SCENE_STUDY__.state().museumLevel")==1
   print(f"PASS {width}: storyLv1 held, new structural and display/staff collision with entrance visual drawing")
   page.close()
  browser.close()
finally:
 server.shutdown();server.server_close()