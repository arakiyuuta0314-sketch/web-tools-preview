"""Real Chrome tests of portable movable A18 layout; no live game changes."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops
import json
D=Path(__file__).resolve().parent
manifest=json.loads((D/'initial-layout.json').read_text('utf8'))
assert manifest['objects']['counter']=={'x':425,'y':396,'w':175,'h':96}
image=Image.open(D/'gallery1_v06_counter175_initial.png').convert('RGB')
assert image.size==(930,582)
old=Image.open(D.parent/'gallery1_v05_preferred_layout.png').convert('RGB')
diff=ImageChops.difference(old,image).getbbox()
assert diff and diff[1]>=390 and diff[3]<=500,('Unexpected changes outside counter',diff)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(D)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
  for width,height in [(1180,900),(390,844)]:
   ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
   page=ctx.new_page()
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
   assert response.status==200
   current=lambda:page.evaluate('window.__A18_LAYOUT_EDITOR__.getState()')
   state=current()
   assert state['objects']['counter']==manifest['objects']['counter']
   assert all(page.locator('img[src="'+s+'"]').evaluate('e=>e.complete && e.naturalWidth>0')
     for s in ['architecture.png','wall4.png','wall5.png','counter175.png','side-walls.png'])
   assert page.locator('#warning').inner_text()==''
   # 5px nudging: keyboard and UI.
   page.locator('[data-pick=counter]').click()
   page.locator('[data-move="10,0"]').click()
   assert current()['objects']['counter']['x']==435
   page.locator('#undo').click()
   assert current()['objects']['counter']['x']==425
   page.locator('#redo').click()
   assert current()['objects']['counter']['x']==435
   page.locator('#coord-x').fill('425')
   page.locator('#coord-x').press('Tab')
   assert current()['objects']['counter']['x']==425
   # Enable draggable wall5 with pointer to test real deltas in logical units.
   page.locator('#center-view').click()
   rect=page.locator('[data-object=wall5]').bounding_box()
   assert rect and rect['width']>100,(width,rect)
   cx=rect['x']+rect['width']*.45;cy=rect['y']+rect['height']*.6
   page.mouse.move(cx,cy)
   page.mouse.down()
   page.mouse.move(cx-24,cy+8,steps=6)
   page.mouse.up()
   changed=current()['objects']['wall5']
   assert changed['x']==598 and changed['y']==296,(width,changed)
   # Reload retains state in this browser origin.
   page.reload(wait_until='networkidle')
   assert current()['objects']['wall5']['x']==598
   # Import strict rejected dimensions -> preserve original.
   page.locator('summary').click()
   page.locator('#show-import').click()
   bad=json.dumps({'objects':{**current()['objects'],'counter':{'x':425,'y':396,'w':205,'h':96}}})
   page.locator('#json-text').fill(bad)
   page.locator('#apply-import').click()
   assert '失敗' in page.locator('#status').inner_text()
   assert current()['objects']['counter']['w']==175
   # Reset supports user confirmation
   page.once('dialog',lambda diag:diag.accept())
   page.locator('#reset').click()
   assert current()['objects']==manifest['objects']
   # pan mode disables drag; zoom works
   page.locator('#pan-mode').click()
   assert page.locator('[data-object=wall4]').evaluate('e=>getComputedStyle(e).pointerEvents')=='none'
   page.locator('#zoom').select_option('.5')
   assert page.locator('#outer').evaluate('e=>Math.round(e.getBoundingClientRect().width)')==465
   page.locator('#edit-mode').click()
   page.screenshot(path=str(D/f'qa_preview_{width}.png'),full_page=True)
   assert not errors,errors
   print('PASS',width,'px viewport / dragging + undo/redo + persistence + import validation + zoom + no JS errors')
   ctx.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
