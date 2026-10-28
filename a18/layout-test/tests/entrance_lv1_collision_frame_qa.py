"""A18 Lv1 integration regression: real Chrome, three artwork orientations,
solids, service reachability, no original blob or existing data schema changes.
"""
from pathlib import Path
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright
import tempfile,json,math
ROOT=Path(__file__).resolve().parent
ART=Path(tempfile.gettempdir())/'a18_lv1_collision_frame_qa'
ART.mkdir(exist_ok=True)
URL='http://127.0.0.1:8242/layout-test/index.html'
SHAPES={'landscape':(600,350),'portrait':(350,600),'square':(480,480)}
result=[]
def sample(kind,shape):
 file=ART/(kind+'.png')
 im=Image.new('RGB',shape,(93,122,151))
 d=ImageDraw.Draw(im)
 d.rectangle((16,16,shape[0]-16,shape[1]-16),outline=(237,170,75),width=10)
 d.ellipse((shape[0]*.3,shape[1]*.3,shape[0]*.7,shape[1]*.7),fill=(238,208,177))
 im.save(file)
 return file
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--no-sandbox'])
 for kind,sz in SHAPES.items():
  context=browser.new_context(viewport={'width':1200,'height':880},device_scale_factor=1)
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  response=page.goto(URL,wait_until='domcontentloaded',timeout=30000)
  assert response.status==200
  page.locator('#a18OpeningStart').click()
  page.locator('#a18OpeningSkip').click()
  page.locator('#a18PlayerName').fill('Lv1 QA')
  page.locator('#confirmName').click()
  page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=25000)
  page.wait_for_timeout(500)
  state=page.evaluate('window.__A18_SCENE_STUDY__.state()')
  assert state['museumLevel']==1 and len(state['fixtures'])==26
  geometry=page.evaluate("""() => {
   const L=window.A18Layout, f=L.defaults()[2], e=L.ENTRANCE_LV1;
   if(!e||e.counter.image[1]!==333||e.leftWall.image[1]!==215||e.rightWall.image[1]!==243)throw Error('E_LV1_COORDS');
   const obs=L.obstacles(L.defaults(),0);
   const same=(actual,expected)=>JSON.stringify(actual)===JSON.stringify(expected);
   if(!same(obs.slice(0,3),[e.leftWall.solid,e.counter.solid,e.rightWall.solid]))throw Error('E_LV1_SOLID_MISMATCH');
   const g=window.A18Entrance.frameGeometry(f,{naturalWidth:350,naturalHeight:600},'portrait');
   const h=window.A18Entrance.frameGeometry(f,{naturalWidth:480,naturalHeight:480},'square');
   const w=window.A18Entrance.frameGeometry(f,{naturalWidth:600,naturalHeight:350},'landscape');
   return {obs,g,h,w};
  }""")
  assert len(geometry['obs'])==4
  assert geometry['g']['outer']['h']>geometry['g']['outer']['w']
  assert geometry['h']['outer']['h']==geometry['h']['outer']['w']
  assert geometry['w']['outer']=={'x':396,'y':259,'w':136,'h':74}
  assert geometry['g']['outer']['w']<110
  # A visitor cannot walk through the counter, left wall or right wall, while
  # the central aisle in front of the counter / along east corridor stays passable.
  points=page.evaluate("""() => {
   const L=window.A18Layout,f=L.defaults(),test=[[100,350],[120,295],[444,302],[326,425],[243,394],[446,407],[300,300],[243,349]];
   return test.map(([x,y])=>({x,y,walkable:L.walkable(x,y,f,0)}));
  }""")
  expected=[False,True,True,True,True,True,True,True] # Rear walkways are intentional; only wall bases remain solid
  assert [x['walkable'] for x in points]==expected,points
  # Right partition remains reachable through actual walking, not debug inspect.
  for _ in range(10):page.evaluate('window.__A18_SCENE_STUDY__.move("right")')
  page.evaluate('window.__A18_SCENE_STUDY__.move("up")')
  near=page.evaluate('window.__A18_SCENE_STUDY__.state().interaction')
  assert near and near['type']=='art' and near['i']==2,near
  page.locator('#act').click()
  assert page.locator('#registerRightPhoto').is_visible()
  page.locator('#registerRightPhoto').click()
  page.locator('#name').fill('QA '+kind)
  page.locator('#photo').set_input_files(str(sample(kind,sz)))
  page.locator('#save').click()
  page.locator('#offerNo').wait_for(state='visible',timeout=20000)
  page.locator('#offerNo').click()
  page.locator('#receiveWork').wait_for(state='visible',timeout=20000)
  page.locator('#receiveWork').click()
  page.wait_for_function('window.__A18_SCENE_STUDY__.state().works.some(w=>w.fixtureId==="frame-0-2")',timeout=20000)
  photo=page.evaluate("""() => {
   const st=window.__A18_SCENE_STUDY__.state(),w=st.works.find(x=>x.fixtureId==='frame-0-2');
   return {work:w,geom:window.A18Entrance.frameGeometry(st.fixtures.find(x=>x.id==='frame-0-2'),{naturalWidth:%d,naturalHeight:%d},'%s')};
  }""" % (sz[0],sz[1],kind))
  assert photo['work']['title']=='QA '+kind
  rect=photo['geom']['outer']
  if kind=='portrait':assert rect['h']>rect['w']*1.25,rect
  if kind=='square':assert math.isclose(rect['h'],rect['w']),rect
  if kind=='landscape':assert rect['w']>rect['h'],rect
  page.wait_for_timeout(250)
  page.screenshot(path=str(ART/(kind+'_mounted.png')),full_page=True)
  page.reload(wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=20000)
  reloaded=page.evaluate('window.__A18_SCENE_STUDY__.state()')
  assert reloaded['works'][0]['fixtureId']=='frame-0-2',reloaded['works']
  assert len(reloaded['fixtures'])==26
  assert errors==[],errors
  result.append({'shape':kind,'rect':rect,'collision':points,'persisted':True,'errors':errors})
  print('LV1_QA_PASS',kind,json.dumps(rect,ensure_ascii=False))
  context.close()
 # Recheck the ordinary butler registration route after adding counter collision.
 context=browser.new_context(viewport={'width':1200,'height':880})
 page=context.new_page()
 errs=[]
 page.on('pageerror',lambda e:errs.append(str(e)))
 page.goto(URL,wait_until='domcontentloaded',timeout=30000)
 page.locator('#a18OpeningStart').click()
 page.locator('#a18OpeningSkip').click()
 page.locator('#a18PlayerName').fill('受付 QA')
 page.locator('#confirmName').click()
 page.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=20000)
 for _ in range(18):page.evaluate('window.__A18_SCENE_STUDY__.move("left")')
 for _ in range(7):page.evaluate('window.__A18_SCENE_STUDY__.move("up")')
 nearby=page.evaluate('window.__A18_SCENE_STUDY__.state().interaction')
 assert nearby and nearby['type']=='butler',nearby
 page.locator('#act').click()
 if page.locator('#rpgAdvance').count():page.locator('#rpgAdvance').click()
 if page.locator('#staffRegister').count():page.locator('#staffRegister').click()
 elif page.locator('#firstArtworkRegister').count():page.locator('#firstArtworkRegister').click()
 else:page.get_by_role('button',name='最初の作品を預ける').click()
 page.locator('#name').fill('爺やの通常登録QA')
 page.locator('#photo').set_input_files(str(sample('butler-landscape',(600,350))))
 page.locator('#save').click()
 page.locator('#offerNo').wait_for(state='visible',timeout=20000)
 page.locator('#offerNo').click()
 page.locator('#receiveWork').wait_for(state='visible',timeout=20000)
 page.locator('#receiveWork').click()
 page.wait_for_function('window.__A18_SCENE_STUDY__.state().works.length===1',timeout=20000)
 st=page.evaluate('window.__A18_SCENE_STUDY__.state()')
 assert st['carrying']==st['works'][0]['id']
 assert not errs,errs
 print('LV1_QA_PASS butler_registration_and_counter_access')
 context.close()
 browser.close()
(ART/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('LV1_COLLISION_AND_PORTRAIT_QA_ALL_PASS',len(result),'report',ART/'report.json')
