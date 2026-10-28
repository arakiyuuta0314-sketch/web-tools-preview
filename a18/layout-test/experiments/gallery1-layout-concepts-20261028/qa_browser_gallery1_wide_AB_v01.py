"""Isolated Chrome phone scroll QA of static concept preview. No game save state."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
class Q(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=str(ROOT)))
Thread(target=srv.serve_forever,daemon=True).start()
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{srv.server_port}/gallery1_wide_AB_preview_v01.html',wait_until='networkidle')
        for key in ('A','B','A'):
            page.locator(f'[data-type="{key}"]').click()
            expected='gallery1_wide_'+('A_wall_6frames' if key=='A' else 'B_feature_5frames')+'_v01.png'
            page.wait_for_function('(src)=>document.querySelector("#photo").complete && document.querySelector("#photo").getAttribute("src")===src',arg=expected)
            assert page.locator('[aria-pressed="true"]').count()==1
            size=page.eval_on_selector('#view','e=>[e.clientWidth,e.scrollWidth,e.scrollLeft]')
            assert size[1]>size[0]+300,(key,size)
            assert size[2]>100,(key,size)
            if key=='B':
                page.screenshot(path=str(ROOT/'gallery1_wide_mobile_browser_B_qa.png'),full_page=True)
                page.eval_on_selector('#view','e=>e.scrollLeft=0')
                assert page.eval_on_selector('#view','e=>e.scrollLeft')==0
        assert not errors,errors
        print('PASS Chrome 390px A/B toggle, right entrance initial pan, leftward pan, zero JS errors')
        browser.close()
finally:
    srv.shutdown()
    srv.server_close()
