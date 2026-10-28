"""A18 rear-left frame (frame-0-0): real walk and front interaction regression."""
from playwright.sync_api import sync_playwright
import json,math
BASE='http://127.0.0.1:8242/layout-test/index.html'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
 context=b.new_context(viewport={'width':1200,'height':880})
 page=context.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 r=page.goto(BASE,wait_until='domcontentloaded',timeout=30000)
 assert r.status==200,r.status
 page.locator('#a18OpeningStart').click()
 page.locator('#a18OpeningSkip').click()
 page.locator('#a18PlayerName').fill('展示枠QA')
 page.locator('#confirmName').click()
 page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=25000)
 geometry=page.evaluate('''() => {
   const L=window.A18Layout,api=window.__A18_SCENE_STUDY__,state=api.state();
   return { anchors:state.interactionAnchors.filter(x=>x.type==='art'),
    frame:window.A18Entrance.frameGeometry(state.fixtures.find(f=>f.id==='frame-0-0'),null),
    at:L.anchor(state.fixtures.find(f=>f.id==='frame-0-0'),0),
    can:L.walkable(116,228,state.fixtures,0),level:state.museumLevel,rooms:state.fixtures.length };
 }''')
 assert geometry['level']==1 and geometry['rooms']==28,geometry
 assert geometry['at']=={'x':116,'y':228},geometry
 assert geometry['can'] is True,geometry
 frame=geometry['frame']['outer']
 assert math.isclose(frame['x']+frame['w']/2,116,abs_tol=1),frame
 assert frame['y']+frame['h']<228,frame
 assert geometry['anchors'][0]['x']==116 and geometry['anchors'][0]['y']==228
 assert geometry['anchors'][1]['x']==439 and geometry['anchors'][2]['x']==447
 # The old sideways location must not trigger the left rear frame.
 before=page.evaluate("""() => {
  let api=window.__A18_SCENE_STUDY__;
  return {oldPointCan:api.canMove(243,300),anchors:api.state().interactionAnchors};
 }""")
 assert before['oldPointCan'] is True,before
 # Walk behind the partition via its right edge: up to y≈257, then west
 # to x≈122, then north to y≈233 in front of the rear-left painting.
 for _ in range(14):page.evaluate('window.__A18_SCENE_STUDY__.move("up")')
 for _ in range(17):page.evaluate('window.__A18_SCENE_STUDY__.move("left")')
 for _ in range(2):page.evaluate('window.__A18_SCENE_STUDY__.move("up")')
 state=page.evaluate('window.__A18_SCENE_STUDY__.state()')
 assert state['pos']['x']<140 and state['pos']['y']<245,state
 assert state['interaction'] and state['interaction']['type']=='art' and state['interaction']['i']==0,state
 assert page.locator('#act').is_visible()
 page.locator('#act').click()
 assert page.locator('#dialog').is_visible()
 print('REAR_LEFT_FRAME_IN_FRONT_QA_PASS',json.dumps({'anchor':geometry['at'],'frame':frame,'player':state['pos'],'action':state['interaction']},ensure_ascii=False))
 assert not errors,errors
 context.close()
 b.close()
