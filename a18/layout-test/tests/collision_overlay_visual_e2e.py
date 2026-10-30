"""A18 actual-browser validation: collision debug overlay must match live data."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(r"C:\Users\User\source\repos\web-tools-preview-a18-gallery-display-names-20261028")
OUT=ROOT/"a18/layout-test/tests/collision-visual-qa"
OUT.mkdir(parents=True,exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
url=f"http://127.0.0.1:{server.server_port}/a18/layout-test/index.html"
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel="chrome",headless=True)
  for width,height in ((844,390),(390,844)):
   context=browser.new_context(viewport={"width":width,"height":height},is_mobile=True,has_touch=True)
   page=context.new_page()
   errors=[];failed=[]
   page.on("pageerror",lambda e:errors.append(str(e)))
   page.on("requestfailed",lambda r:failed.append(r.url))
   response=page.goto(url+"?qa=1&hitboxes=1",wait_until="domcontentloaded")
   assert response.status==200
   page.locator("#a18OpeningStart").click()
   page.locator("#a18OpeningSkip").click()
   page.locator("#a18PlayerName").fill("通行判定表示")
   page.locator("#confirmName").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__?.ready()===true")
   if page.locator("#skipTour").count() and page.locator("#skipTour").is_visible():page.locator("#skipTour").click()
   if page.locator("#overlay").is_visible():page.evaluate("document.querySelector('#overlay').click()")
   page.wait_for_timeout(80)
   assert page.evaluate("window.__A18_SCENE_STUDY__.collisionOverlay().enabled")
   assert page.locator("#hitboxToggle").is_visible()
   assert page.locator("#hitboxToggle").get_attribute("aria-pressed")=="true"
   page.locator("#settingsGear").click(force=True)
   page.locator("#testMuseumLevel").select_option("6")
   page.locator("#applyTestMuseumLevel").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__.state().museumLevel===6")
   for room in range(6):
    if room:
     page.evaluate("(r)=>window.__A18_SCENE_STUDY__.changeScene(r,{direction:window.A18Layout.ROOM_LINKS[window.__A18_SCENE_STUDY__.state().galleryIndex].north===r?'north':'east'})",room) if False else None
     # Keep actual 14-way graph: navigate from entrance to each target via correct paths.
     if room!=page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex"):
      # Reset to entrance via real graph before each target; no direct mutator.
      current=page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")
      while current!=0:
       next_room,direction={1:(0,"east"),2:(0,"west"),3:(1,"south"),4:(2,"south"),5:(0,"south")}[current]
       assert page.evaluate("([r,d])=>window.__A18_SCENE_STUDY__.changeScene(r,{direction:d})",[next_room,direction])
       current=page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")
      route={1:[(1,"west")],2:[(2,"east")],3:[(1,"west"),(3,"north")],4:[(2,"east"),(4,"north")],5:[(5,"north")]}[room]
      for to,direction in route:
       assert page.evaluate("([r,d])=>window.__A18_SCENE_STUDY__.changeScene(r,{direction:d})",[to,direction])
    page.wait_for_function("(r)=>window.__A18_SCENE_STUDY__.state().galleryIndex===r",arg=room)
    page.wait_for_timeout(120)
    d=page.evaluate("window.__A18_SCENE_STUDY__.collisionOverlay()")
    assert d["room"]==room
    assert d["passages"]==page.evaluate("(r)=>window.A18Layout.PASSAGES[r]",room)
    assert d["arrivals"]==page.evaluate("(r)=>window.A18Layout.ARRIVALS[r]",room)
    assert len(d["obstacles"])==len(page.evaluate("(r)=>window.A18Layout.obstacles(window.A18Layout.defaults(),r)",room))
    page.screenshot(path=str(OUT/f"room{room}_{width}.png"))
    print(f"PASS {width}: room{room}, {len(d['passages'])} exits, {len(d['obstacles'])} obstacles, actual drawing")
   # Click visible toggle, no change to persisted data or story.
   before=page.evaluate("""async()=>{const s=await window.A18P2Store.load();return {revision:s.revision,progression:JSON.stringify(s.progression)}}""")
   page.locator("#hitboxToggle").click(force=True)
   assert not page.evaluate("window.__A18_SCENE_STUDY__.collisionOverlay().enabled")
   assert page.locator("#hitboxToggle").get_attribute("aria-pressed")=="false"
   page.locator("#settingsGear").click(force=True)
   assert not page.locator("#showCollisionLines").is_checked()
   page.locator("#showCollisionLines").check()
   page.locator("#closeSettings").click()
   assert page.evaluate("window.__A18_SCENE_STUDY__.collisionOverlay().enabled")
   after=page.evaluate("""async()=>{const s=await window.A18P2Store.load();return {revision:s.revision,progression:JSON.stringify(s.progression)}}""")
   assert before==after,(before,after)
   assert not errors,errors
   assert not failed,failed
   context.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
