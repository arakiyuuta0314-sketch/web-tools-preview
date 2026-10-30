"""Real-game QA: all 14 actual walk-triggered portals, not direct changeScene mocks."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(r"C:\Users\User\source\repos\web-tools-preview-a18-gallery-display-names-20261028")
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel="chrome",headless=True)
  for vw,vh in [(844,390),(390,844)]:
   page=browser.new_page(viewport={"width":vw,"height":vh},is_mobile=True,has_touch=True)
   errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
   page.goto(f"http://127.0.0.1:{server.server_port}/a18/layout-test/index.html?qa=1",wait_until="domcontentloaded")
   page.locator('#a18OpeningStart').click();page.locator('#a18OpeningSkip').click()
   page.locator('#a18PlayerName').fill('通路判定QA')
   page.locator('#confirmName').click()
   page.wait_for_function("window.__A18_SCENE_STUDY__?.ready()===true")
   if page.locator('#skipTour').count() and page.locator('#skipTour').is_visible():page.locator('#skipTour').click()
   if page.locator('#overlay').is_visible():page.evaluate("document.querySelector('#overlay').click()")
   page.locator('#settingsGear').click()
   page.locator('#testMuseumLevel').select_option('6')
   page.locator('#applyTestMuseumLevel').click()
   page.wait_for_function("window.__A18_SCENE_STUDY__.state().museumLevel===6")
   assert page.evaluate("typeof window.__A18_SCENE_STUDY__.qaPlaceAt === 'function'")
   links=page.evaluate("window.A18Layout.ROOM_LINKS")
   boxes=page.evaluate("window.A18Layout.PASSAGES")
   arrivals=page.evaluate("window.A18Layout.ARRIVALS")
   # Use normal scene transition to prepare the selected source room.
   def navigate(target):
    state=page.evaluate("window.__A18_SCENE_STUDY__.state()")
    if state['galleryIndex']==target:return
    links={int(k):{d:v for d,v in exits.items()} for k,exits in page.evaluate('window.A18Layout.ROOM_LINKS').items()}
    from collections import deque
    queue=deque([(state['galleryIndex'],[])])
    seen={state['galleryIndex']}
    while queue:
     room,path=queue.popleft()
     if room==target:break
     for direct,nxt in links[room].items():
      if nxt not in seen:seen.add(nxt);queue.append((nxt,path+[(nxt,direct)]))
    else:raise AssertionError('No route '+str(target))
    for room,direction in path:
     ok=page.evaluate("([dest,d])=>window.__A18_SCENE_STUDY__.changeScene(dest,{direction:d})",[room,direction])
     assert ok,('normal navigation failed',room,direction)
     page.wait_for_function("(r)=>window.__A18_SCENE_STUDY__.state().galleryIndex===r",arg=room)
   verified=0
   for room,exits in sorted(links.items(),key=lambda v:int(v[0])):
    for direction,target in exits.items():
     room=int(room);navigate(room)
     box=boxes[str(room)][direction]
     x=(box['x1']+box['x2'])/2;y=(box['y1']+box['y2'])/2
     # Force a *valid nearby floor* for the QA setup only. The actual
     # crossing is done by production move() and portalDirection().
     if direction=='west':start=[box['x1']+55,y];moving='left'
     elif direction=='east':start=[box['x2']-55,y];moving='right'
     elif direction=='north':start=[x,box['y2']+37];moving='up'
     else:start=[x,box['y1']-37];moving='down'
     safe=page.evaluate("([x,y])=>window.__A18_SCENE_STUDY__.canMove(x,y)",start)
     assert safe,(room,direction,'approach blocked',start)
     page.evaluate("([x,y])=>window.__A18_SCENE_STUDY__.qaPlaceAt(x,y)",start)
     done=False
     for _ in range(15):
      page.evaluate("(d)=>window.__A18_SCENE_STUDY__.move(d)",moving)
      dest=page.evaluate("window.__A18_SCENE_STUDY__.state().galleryIndex")
      if dest!=room:
       assert dest==target,(room,direction,dest,target)
       done=True;break
      page.wait_for_timeout(5)
     assert done,(room,direction,'crossing not triggered')
     actual=page.evaluate("window.__A18_SCENE_STUDY__.state().pos")
     back={'north':'south','south':'north','west':'east','east':'west'}[direction]
     arrival=arrivals[str(target)][back]
     assert abs(actual['x']-arrival['x'])<=13 and abs(actual['y']-arrival['y'])<=13, (room,direction,actual,arrival) # held directional input may move 1 step on arrival
     verified+=1
     print(f'PASS {vw}: {room} {direction} -> {target}, arrived {actual["x"]:.0f}/{actual["y"]:.0f}',flush=True)
   assert verified==14 and not errors,(verified,errors)
   page.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
