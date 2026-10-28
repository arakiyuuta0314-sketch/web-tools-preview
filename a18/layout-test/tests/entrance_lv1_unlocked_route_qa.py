"""Prove actual locked/unlocked portal walking and save on return using a synthetic,
schema-valid Lv.2 save built through P2.plan rather than bypassing progression.
Isolated browser profile only; no real user saves.
"""
from playwright.sync_api import sync_playwright
import tempfile,json
from pathlib import Path
root=Path(tempfile.gettempdir())/'a18_lv1_navigation_qa_20261028'
root.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1200,'height':880})
 pg=ctx.new_page()
 errors=[]
 pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.goto('http://127.0.0.1:8242/layout-test/index.html',wait_until='domcontentloaded',timeout=30000)
 pg.locator('#a18OpeningStart').click()
 pg.locator('#a18OpeningSkip').click()
 pg.locator('#a18PlayerName').fill('エリア移動')
 pg.locator('#confirmName').click()
 pg.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=25000)
 seeded=pg.evaluate("""async()=> {
  const P=window.A18P2Store,L=window.A18Layout,st=await P.load();
  if(!st||st.progression.unlockedThroughLevel!==1||st.works.length)throw Error('E_QA_EXPECT_CLEAN_LV1');
  const candidate=P.copy(st),c=document.createElement('canvas');c.width=60;c.height=40;
  const cx=c.getContext('2d');cx.fillStyle='#bb9966';cx.fillRect(0,0,60,40);
  const raw=await new Promise(res=>c.toBlob(res,'image/png'));
  for(let i=0;i<3;i++){
   const f=candidate.fixtures.find(f=>f.id==='frame-0-'+i);
   if(!f)throw Error('E_QA_FRAME_'+i);
   const id='synthetic-test-'+i;
   candidate.works.push({id,title:'QA-'+i,notes:'',complete:null,registered:'2026-10-28',
    pieces:null,preferredShape:'landscape',thumbnail:null,displaySrc:null,
    fixtureId:f.id,originalBlob:raw});
  }
  L.syncWorks(candidate.fixtures,candidate.works);
  const plan=P.plan(st,candidate);
  if(plan.nextSave.progression.unlockedThroughLevel!==2)throw Error('E_QA_LV2_GATE');
  await P.commit(st.revision,plan.nextSave);
  const seen=P.eventAction(plan.nextSave,'lv2-v1','finish');
  await P.commit(plan.nextSave.revision,seen);
  return {unlock:seen.progression.unlockedThroughLevel,events:seen.progression.events};
 }""")
 assert seeded['unlock']==2,seeded
 pg.reload(wait_until='domcontentloaded',timeout=30000)
 pg.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=25000)
 # The entry room starts on the main floor and must be allowed into WEST.
 assert pg.evaluate('window.A18P2Store.canTraverse(0,"west", {unlockedThroughLevel:2})')==True
 # Walking south of the counter, then west into the actual threshold.
 for _ in range(3):pg.evaluate('window.__A18_SCENE_STUDY__.move("down")')
 for _ in range(27):
  pg.evaluate('window.__A18_SCENE_STUDY__.move("left")')
  if pg.evaluate('window.__A18_SCENE_STUDY__.state().galleryIndex')!=0:break
 pg.wait_for_function('window.__A18_SCENE_STUDY__.state().galleryIndex===1',timeout=20000)
 inroom=pg.evaluate('window.__A18_SCENE_STUDY__.state()')
 assert inroom['galleryIndex']==1 and inroom['museumLevel']==2
 assert inroom['pos']['x']>480 and inroom['pos']['y']>370
 assert len(inroom['works'])==3
 pg.screenshot(path=str(root/'gallery02_from_west_portal.png'),full_page=True)
 # Re-enter via EAST doorway. The synthetic collection must still be present.
 for _ in range(8):
  pg.evaluate('window.__A18_SCENE_STUDY__.move("right")')
  if pg.evaluate('window.__A18_SCENE_STUDY__.state().galleryIndex')==0:break
 pg.wait_for_function('window.__A18_SCENE_STUDY__.state().galleryIndex===0',timeout=20000)
 returned=pg.evaluate('window.__A18_SCENE_STUDY__.state()')
 assert returned['galleryIndex']==0 and returned['museumLevel']==2
 assert len(returned['works'])==3
 assert returned['pos']['x']<115 and returned['pos']['y']>435
 pg.reload(wait_until='domcontentloaded',timeout=30000)
 pg.wait_for_function('window.__A18_SCENE_STUDY__?.ready()===true',timeout=25000)
 saved=pg.evaluate('window.__A18_SCENE_STUDY__.state()')
 assert saved['galleryIndex']==0 and len(saved['works'])==3 and saved['museumLevel']==2
 assert not errors,errors
 print('ACTUAL_UNLOCKED_LV2_WEST_PORTAL_AND_RETURN_QA_PASS',json.dumps({
  'after_entering':inroom['pos'],'returned':returned['pos'],'works':len(saved['works'])},ensure_ascii=False))
 ctx.close()
 b.close()
