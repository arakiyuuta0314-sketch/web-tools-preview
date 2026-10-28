from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).resolve().parent
class Q(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=str(P)))
Thread(target=srv.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  r=page.goto(f'http://127.0.0.1:{srv.server_port}/gallery1_v05_layout_compare.html',wait_until='networkidle')
  assert r.status==200
  for key,path in [('P','gallery1_v05_preferred_layout.png'),('Q','gallery1_v04_Q_open.png'),('R','gallery1_v04_R_asym.png'),('P','gallery1_v05_preferred_layout.png')]:
   page.locator(f'[data-id="{key}"]').click()
   page.wait_for_function('(k)=>document.querySelector("#room").complete && document.querySelector("#room").naturalWidth===930 && document.querySelector("#room").getAttribute("src")===k',arg=path)
   assert page.locator('[aria-pressed="true"]').count()==1
   dims=page.locator('#view').evaluate('e=>[e.clientWidth,e.scrollWidth,e.scrollLeft]')
   assert dims[1]>dims[0]+300 and dims[2]>200,(key,dims)
  page.locator('#view').evaluate('e=>e.scrollLeft=0')
  assert page.locator('#view').evaluate('e=>e.scrollLeft')==0
  page.screenshot(path=str(P/'gallery1_v05_browser_mobileQA.png'),full_page=True)
  assert not errors,errors
  browser.close()
  print('PASS mobile Chrome 390px three candidates toggled, scroll entry->west, no page errors')
finally:srv.shutdown();srv.server_close()
