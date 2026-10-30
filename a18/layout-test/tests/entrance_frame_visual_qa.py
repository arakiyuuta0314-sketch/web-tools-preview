from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(r"C:\Users\User\source\repos\web-tools-preview-a18-gallery-display-names-20261028")
OUT=ROOT/"a18/layout-test/tests/entrance-frame-qa"
OUT.mkdir(exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel="chrome",headless=True)
  for w,h in [(844,390),(390,844)]:
   page=browser.new_page(viewport={"width":w,"height":h},is_mobile=True,has_touch=True)
   page.goto(f"http://127.0.0.1:{server.server_port}/a18/layout-test/index.html?qa=1")
   page.locator("#a18OpeningStart").click();page.locator("#a18OpeningSkip").click()
   page.locator("#a18PlayerName").fill("背景QA")
   page.locator("#confirmName").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__?.ready()===true")
   if page.locator("#skipTour").count() and page.locator("#skipTour").is_visible():page.locator("#skipTour").click()
   if page.locator("#overlay").is_visible():page.evaluate("document.querySelector('#overlay').click()")
   page.locator("#settingsGear").click()
   page.locator("#testMuseumLevel").select_option("6")
   page.locator("#applyTestMuseumLevel").click()
   page.wait_for_function("window.__A18_SCENE_STUDY__.state().museumLevel===6")
   page.wait_for_timeout(350)
   page.screenshot(path=str(OUT/f"entrance_after_{w}.png"))
   if w==844:
    page.evaluate("window.__A18_SCENE_STUDY__.changeScene(5,{direction:'north'})")
    page.wait_for_timeout(220)
    page.screenshot(path=str(OUT/f"gallery5_after_{w}.png"))
   page.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
