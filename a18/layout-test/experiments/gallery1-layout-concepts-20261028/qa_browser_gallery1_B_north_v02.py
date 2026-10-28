from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
DIR=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(DIR)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  response=page.goto(f'http://127.0.0.1:{server.server_port}/gallery1_B_north_preview_v02.html',wait_until='networkidle')
  assert response.status==200
  page.wait_for_function('document.querySelector("#scene").complete')
  start=page.locator('#view').evaluate('(e)=>[e.clientWidth,e.scrollWidth,e.scrollLeft]')
  assert start[1]>start[0]+400 and start[2]>300,start
  page.locator('#route').click()
  page.wait_for_function('document.querySelector("#scene").complete')
  assert page.locator('#route').get_attribute('aria-pressed')=='true'
  assert page.locator('#scene').get_attribute('src')=='gallery1_B_north_to_gallery3_route_v02.png'
  page.locator('#view').evaluate('(e)=>e.scrollLeft=0')
  assert page.locator('#view').evaluate('(e)=>e.scrollLeft')==0
  page.screenshot(path=str(DIR/'gallery1_B_north_mobile_qa_v02.png'),full_page=True)
  page.locator('#normal').click()
  assert page.locator('#normal').get_attribute('aria-pressed')=='true'
  assert not errors,errors
  print('PASS Chrome iPhone 390px normal/route controls, horizontal scroll both ends, no page errors')
  browser.close()
finally:
 server.shutdown();server.server_close()
