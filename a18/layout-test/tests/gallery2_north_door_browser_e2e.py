"""Real browser screenshots of gallery 2 north door matching gallery 1."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(r"C:\Users\User\source\repos\web-tools-preview-a18-gallery-display-names-20261028")
OUT=ROOT/"a18/layout-test/tests/gallery2-northdoor-qa"
OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(ROOT)))
Thread(target=srv.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel="chrome",headless=True)
  for w,h in ((844,390),(390,844)):
   page=browser.new_page(viewport={"width":w,"height":h},is_mobile=True,has_touch=True)
   errs=[];fail=[]
   page.on("pageerror",lambda x:errs.append(str(x)))
   page.on("requestfailed",lambda x:fail.append(x.url))
   res=page.goto(f"http://127.0.0.1:{srv.server_port}/a18/layout-test/index.html?qa=1&hitboxes=1")
   assert res.status==200
   page.locator("#a18OpeningStart").click();page.locator("#a18OpeningSkip").click()
   page.locator("#a18PlayerName").fill("北扉確認")
   page.locator("#confirmName").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__?.ready()===true")
   if page.locator("#skipTour").count() and page.locator("#skipTour").is_visible():page.locator("#skipTour").click()
   if page.locator("#overlay").is_visible():page.evaluate("document.querySelector('#overlay').click()")
   page.locator("#settingsGear").click()
   page.locator("#testMuseumLevel").select_option("6")
   page.locator("#applyTestMuseumLevel").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__.state().museumLevel===6")
   assert page.evaluate("window.__A18_SCENE_STUDY__.changeScene(2,{direction:'east'})")
   page.wait_for_function("window.__A18_SCENE_STUDY__.state().galleryIndex===2")
   page.wait_for_timeout(400)
   assert page.evaluate("window.__A18_SCENE_STUDY__.collisionOverlay().enabled")
   page.screenshot(path=str(OUT/f"gallery2_northdoor_hitboxes_{w}.png"))
   page.locator("#hitboxToggle").click(force=True)
   page.wait_for_timeout(80)
   page.screenshot(path=str(OUT/f"gallery2_northdoor_clean_{w}.png"))
   if w==390:
    assert page.evaluate("window.__A18_SCENE_STUDY__.qaPlaceAt(465,220)")
    page.wait_for_timeout(170)
    page.screenshot(path=str(OUT/"gallery2_northdoor_mobile_focused_390.png"))
   assert not errs,errs
   assert not fail,fail
   print(f"PASS actual game Chrome {w}x{h}, north door rendered and trigger unchanged",flush=True)
   page.close()
  browser.close()
finally:
 srv.shutdown();srv.server_close()
