"""A18 QA: avatar on first butler dialogue, front counter conversation,
behind-partition walk paths, mobile hint placement, unlocked door traversal.
Run against fresh isolated Chrome contexts (no real user data).
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import tempfile,json
OUT=Path(tempfile.gettempdir())/'a18_lv1_navigation_qa_20261028'
OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:8242/layout-test/index.html'
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
 # Gender selected in actual opening must draw female throughout the butler greeting,
 # before museum title has been committed to saved state.
 gender_ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 gender_page=gender_ctx.new_page()
 errors=[]
 gender_page.on('pageerror',lambda e:errors.append(str(e)))
 response=gender_page.goto(BASE,wait_until='domcontentloaded',timeout=30000)
 assert response.status==200
 gender_page.locator('#a18OpeningStart').click()
 for _ in range(28):
  if gender_page.locator('#a18OpeningName').count():break
  if gender_page.locator('#a18OpeningDialog').count():gender_page.locator('#a18OpeningDialog').click(force=True)
  gender_page.wait_for_timeout(250)
 gender_page.locator('#a18OpeningName').wait_for(timeout=9000)
 gender_page.locator('#a18OpeningName').fill('ゆた')
 gender_page.locator('#a18OpeningNameOk').click()
 for _ in range(35):
  if gender_page.locator('#a18OpeningFemale').count():break
  if gender_page.locator('#a18OpeningDialog').count():
   gender_page.locator('#a18OpeningDialog').click(force=True)
  gender_page.wait_for_timeout(240)
 gender_page.locator('#a18OpeningFemale').wait_for(timeout=20000)
 gender_page.locator('#a18OpeningFemale').click()
 for _ in range(24):
  if gender_page.locator('#a18OpeningMuseumNext').count():break
  if gender_page.locator('#a18OpeningDialog').count():gender_page.locator('#a18OpeningDialog').click(force=True)
  gender_page.wait_for_timeout(200)
 gender_page.locator('#a18OpeningMuseumNext').wait_for(timeout=30000)
 gender_page.wait_for_timeout(200)
 assert gender_page.evaluate('window.__A18_SCENE_STUDY__.state().avatarGender')=='male','Draft should not mutate persisted profile early'
 # The new render uses the draft female while the saved profile remains male.
 # Compare current game avatar canvas crop to same-location female setting after commit.
 gender_page.screenshot(path=str(OUT/'female_first_dialog.png'),full_page=True)
 before=gender_page.locator('#world').evaluate('(e)=>e.toDataURL()')
 gender_page.locator('#a18OpeningMuseumNext').click()
 gender_page.locator('#a18OpeningMuseumNext').click()
 gender_page.locator('#a18OpeningMuseumTitle').fill('QA美術館')
 gender_page.locator('#a18OpeningMuseumOk').click()
 gender_page.wait_for_function('window.__A18_SCENE_STUDY__.state().avatarGender==="female"',timeout=20000)
 gender_page.wait_for_timeout(180)
 after=gender_page.locator('#world').evaluate('(e)=>e.toDataURL()')
 assert before==after,'Preview female artwork must match persisted female artwork at same world position'
 assert not errors,errors
 results.append('female selected before butler name dialogue: PASS')
 # Check mobile hint is just above DPad up button, not floating far into game.
 gender_page.wait_for_function('!document.querySelector("#hint").hidden',timeout=12000)
 hint=gender_page.locator('#hint').bounding_box()
 up=gender_page.locator('[data-d="up"]').bounding_box()
 gap=up['y']-(hint['y']+hint['height'])
 assert 0<=gap<=12,{'gap_px':gap,'hint':hint,'up':up}
 results.append('mobile hint immediately above up button: PASS (gap %.1fpx)'%gap)
 gender_ctx.close()

 # New game, walk from southern edge to front of counter, and behind each screen.
 game_ctx=browser.new_context(viewport={'width':1200,'height':880})
 game_page=game_ctx.new_page()
 failures=[]
 game_page.on('pageerror',lambda e:failures.append(str(e)))
 game_page.goto(BASE,wait_until='domcontentloaded',timeout=30000)
 game_page.locator('#a18OpeningStart').click()
 game_page.locator('#a18OpeningSkip').click()
 game_page.locator('#a18PlayerName').fill('受付テスト')
 game_page.locator('#confirmName').click()
 game_page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=20000)
 st=game_page.evaluate('window.__A18_SCENE_STUDY__.state()')
 assert st['museumLevel']==1 and len(st['fixtures'])==28
 walkable=game_page.evaluate("""() => {
  const L=window.A18Layout,s=window.__A18_SCENE_STUDY__.state();
  const points=[[140,260],[430,288],[140,334],[450,371],[140,454],[243,394]];
  return points.map(([x,y])=>({x,y,ok:L.walkable(x,y,s.fixtures,0)}))
 }""")
 assert [v['ok'] for v in walkable]==[True,True,False,False,True,True],walkable
 for _ in range(3):game_page.evaluate('window.__A18_SCENE_STUDY__.move("down")')
 for _ in range(16):game_page.evaluate('window.__A18_SCENE_STUDY__.move("left")')
 front=game_page.evaluate('window.__A18_SCENE_STUDY__.state()')
 assert front['interaction'] and front['interaction']['type']=='butler',front
 game_page.screenshot(path=str(OUT/'butler_front_reachable.png'),full_page=True)
 game_page.locator('#act').click()
 assert game_page.locator('#dialog').is_visible()
 results.append('counter-front butler dialogue and narrow base collision: PASS')
 game_ctx.close()

 # All locked rooms remain locked at Lv1; no synthetic unlock by movement.
 locked_ctx=browser.new_context(viewport={'width':1200,'height':880})
 locked_page=locked_ctx.new_page()
 locked_page.goto(BASE,wait_until='domcontentloaded',timeout=30000)
 locked_page.locator('#a18OpeningStart').click()
 locked_page.locator('#a18OpeningSkip').click()
 locked_page.locator('#a18PlayerName').fill('経路QA')
 locked_page.locator('#confirmName').click()
 locked_page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=20000)
 # North and left entrances must not become available before required unlocks.
 assert locked_page.evaluate('window.A18P2Store.canTraverse(0,"west",window.A18P2Store.makeInitialV3().progression)')==False
 assert locked_page.evaluate('window.__A18_SCENE_STUDY__.changeScene(1,{direction:"west"})')==False
 # Traverse around left screen from its exposed east edge to upper walkway.
 for _ in range(14):locked_page.evaluate('window.__A18_SCENE_STUDY__.move("up")')
 for _ in range(14):locked_page.evaluate('window.__A18_SCENE_STUDY__.move("left")')
 rear=locked_page.evaluate('window.__A18_SCENE_STUDY__.state().pos')
 assert rear['x']<211 and rear['y']<325,rear
 locked_page.screenshot(path=str(OUT/'left_wall_behind_walkable.png'),full_page=True)
 for _ in range(23):locked_page.evaluate('window.__A18_SCENE_STUDY__.move("right")')
 behind_right=locked_page.evaluate('window.__A18_SCENE_STUDY__.state().pos')
 assert 375<behind_right['x']<522 and behind_right['y']<364,behind_right
 locked_page.screenshot(path=str(OUT/'right_wall_behind_walkable.png'),full_page=True)
 results.append('left/right wall back passages / locked doors remain locked: PASS')
 locked_ctx.close()
 browser.close()
(OUT/'report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
for r in results:print('PASS',r)
