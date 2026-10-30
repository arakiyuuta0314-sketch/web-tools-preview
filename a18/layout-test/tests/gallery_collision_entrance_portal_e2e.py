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
   # Old 5-room collision layout must be absent. This includes staff, floor
   # frame, and former impassable wallFoot boundary positions.
   for room in range(1,6):
    if page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")!=room:
     # Use existing open bidirectional graph; get a live real room via entrance.
     if page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")!=0:
      current=page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")
      path={1:("east",0),2:("west",0),3:("south",1),4:("south",2),5:("south",0)}[current]
      assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.to,{direction:v.dir})",{"to":path[1],"dir":path[0]})
      if path[1]!=0:
       back={1:("east",0),2:("west",0)}[path[1]]
       assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.to,{direction:v.dir})",{"to":back[1],"dir":back[0]})
     route={1:("west",1),2:("east",2),3:("west",1),4:("east",2),5:("north",5)}[room]
     if room in (3,4):
      assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.to,{direction:v.dir})",{"to":route[1],"dir":route[0]})
      route={3:("north",3),4:("north",4)}[room]
     assert page.evaluate("(v)=>window.__A18_SCENE_STUDY__.changeScene(v.to,{direction:v.dir})",{"to":route[1],"dir":route[0]})
    assert page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")==room
    assert page.evaluate("window.__A18_SCENE_STUDY__.state().obstacles.length")==0
    blocked=page.evaluate("""()=>[[100,120],[295,120],[500,150],[260,340],[90,300],[460,300]]
      .filter(pt=>!window.__A18_SCENE_STUDY__.canMove(pt[0],pt[1]))""")
    assert not blocked,(room,blocked)
    assert page.evaluate("window.__A18_SCENE_STUDY__.canMove(10,200)")==False
    print(f"PASS {width}: gallery{room} six legacy obstruction spots walkable; outside boundary blocked")
   assert not errors,errors
   assert page.evaluate("window.__A18_SCENE_STUDY__.state().museumLevel")==1
   print(f"PASS {width}: storyLv1 held, temporary collision reset and entrance visual drawing")
   page.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
