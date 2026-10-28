"""Isolated real Chrome QA for A18 gallery display labels, without user saves."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[3]
EXPECTED=['エントランス','展示室1','展示室2','展示室3','展示室4','展示室5']
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
errors=[]
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':390,'height':844})
        page=context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/a18/layout-test/index.html',wait_until='domcontentloaded')
        page.wait_for_function('window.A18Navigation?.NAMES?.length===6')
        assert page.evaluate('window.A18Navigation.NAMES')==EXPECTED
        page.locator('#a18OpeningStart').click()
        page.locator('#a18OpeningSkip').click()
        page.locator('#a18PlayerName').fill('表示名QA')
        page.locator('#confirmName').click()
        page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true')
        assert page.evaluate('window.__A18_SCENE_STUDY__.state().roomName')=='エントランス'
        if page.locator('#skipTour').is_visible():
            page.locator('#skipTour').click()
        else:
            page.evaluate('window.__A18_SCENE_STUDY__.showFloorMap()')
        if not page.locator('.a18-room-tile').count():
            page.evaluate('window.__A18_SCENE_STUDY__.showFloorMap()')
        labels=page.locator('.a18-room-tile strong').all_text_contents()
        assert len(labels)==6,(labels,errors)
        assert set(labels)==set(EXPECTED),(labels,EXPECTED)
        text=page.locator('.a18-floorplan').inner_text()
        for old in ('展示室02','展示室03','展示室04','展示室05','展示室06'):
            assert old not in text,old
        assert not errors,errors
        print('BROWSER PASS: real Chrome 390x844; onboarding, entrance, map 1..5, no page errors')
        context.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
