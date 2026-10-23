"""P4 Chrome end-to-end: actual indexedDB, 28 frame displays, map, event restores and integrity."""
from pathlib import Path
import json, subprocess, tempfile, traceback, time
framework=Path(__file__).with_name('p4-p2-regression-e2e.py').read_text('utf-8').split('all_results=[];failure=None')[0]
ns={}
exec(framework,ns)
WS,Runner,launch,attach,step_image=(*(ns[k] for k in ('WS','Runner','launch','attach','step_image')),)
ROOT,URL=ns['ROOT'],ns['URL']
all_results=[];failure=None
def digest_expr():
 return """(async()=>{const s=window.__A18_SCENE_STUDY__.p2.persistent();
  return JSON.stringify(await Promise.all(s.works.sort((a,b)=>a.id.localeCompare(b.id)).map(async w=>({
   id:w.id,title:w.title,notes:w.notes,complete:w.complete,registered:w.registered,pieces:w.pieces,
   preferredShape:w.preferredShape,fixtureId:w.fixtureId,displaySrc:w.displaySrc,
   thumbnail:w.thumbnail,originalType:w.originalBlob.type,originalSize:w.originalBlob.size,
   hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await w.originalBlob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('')
  }))));})()"""
def create_and_hang(w,r,room,i):
 wid=f'P4-{room}-{i}'
 if not step_image(w,wid):raise AssertionError('synthetic registration '+wid)
 r.check(f'carrying_{wid}',"window.__A18_SCENE_STUDY__.state().carrying",wid)
 slot=(i if room==0 else 5+(room-1)*5+i)
 w.ev(f'window.__A18_SCENE_STUDY__.inspect({slot})')
 w.wait(f"window.__A18_SCENE_STUDY__.state().works.find(w=>w.id==='{wid}')?.fixtureId==='frame-{room}-{i}'",timeout=12)
def navigate(w,r,target):
 current=w.ev("window.__A18_SCENE_STUDY__.state().galleryIndex")
 links=w.ev("window.__A18_SCENE_STUDY__.state().allRoomLinks")
 level=w.ev("window.__A18_SCENE_STUDY__.state().museumLevel")
 seen={str(current):[]};queue=[str(current)]
 while queue and str(target) not in seen:
  node=queue.pop(0)
  for to in links[node].values():
   to=str(to)
   if int(to)<level and to not in seen:seen[to]=seen[node]+[int(to)];queue.append(to)
 assert str(target) in seen,('No route',current,target)
 for node in seen[str(target)]:
  r.check('navigate_'+str(current)+'_to_'+str(node),f"window.__A18_SCENE_STUDY__.changeScene({node})")
  current=node
 r.check('arrived_'+str(target),"window.__A18_SCENE_STUDY__.state().galleryIndex",target)
def doors(r,level):
 expr=f"""(()=>{{const p=window.__A18_SCENE_STUDY__.p2.persistent().progression;
 const links=window.A18Layout.ROOM_LINKS;let directed=0;
 for(const [from,edges] of Object.entries(links))for(const [dir,to] of Object.entries(edges)){{
 const traversable=window.A18P2Store.canTraverse(+from,dir,p);
 if(traversable!==((+from)<{level}&&to<{level}))return false;
 if(traversable)directed++;
 }}
 return directed==={2*[0,1,2,3,4,7][level-1]};}})()"""
 r.check('level_'+str(level)+'_14_directed_doors',expr,True)
 r.check('level_'+str(level)+'_map_locked_count',f"document.querySelectorAll('.a18-room-tile.locked').length",6-level)
def reload_verify(w,r,level,expect_event=None):
 blob_before=w.ev(digest_expr())
 place_before=w.ev("JSON.stringify([window.__A18_SCENE_STUDY__.state().galleryIndex,window.__A18_SCENE_STUDY__.state().pos])")
 notices_before=w.ev("JSON.stringify(window.__A18_SCENE_STUDY__.p2.persistent().progression.newRoomNotices)")
 w.call('Page.reload',{'ignoreCache':True});w.ready()
 r.check('reloaded_level_'+str(level),"window.__A18_SCENE_STUDY__.state().museumLevel",level)
 r.check('reloaded_blob_meta_sha_'+str(level),digest_expr(),blob_before)
 r.check('reloaded_room_pos_'+str(level),"JSON.stringify([window.__A18_SCENE_STUDY__.state().galleryIndex,window.__A18_SCENE_STUDY__.state().pos])",place_before)
 r.check('reloaded_new_notices_'+str(level),"JSON.stringify(window.__A18_SCENE_STUDY__.p2.persistent().progression.newRoomNotices)",notices_before)
 if expect_event:
  r.check('queued_resumed_'+str(level),"Boolean(document.getElementById('p2EventFinish'))",True)

try:
 with tempfile.TemporaryDirectory(prefix='a18-p4-full-',ignore_cleanup_errors=True) as profile:
  process=launch(profile,9448)
  try:
   w=attach(9448)
   w.call('Page.enable');w.call('Runtime.enable');w.call('Log.enable')
   w.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
   w.call('Page.navigate',{'url':URL});w.ready()
   r=Runner(w)
   r.check('initial_level', "window.__A18_SCENE_STUDY__.state().museumLevel",1)
   r.check('initial_28_frames',"window.__A18_SCENE_STUDY__.p2.persistent().fixtures.length",28)
   r.check('original_schema_v3',"window.__A18_SCENE_STUDY__.p2.persistent().schemaVersion",3)
   r.check('p6_text_source_v1',"window.A18P2Store.DATABASE",'a18-museum-p2-isolated-v3')
   r.js("document.getElementById('introSkipOpening')?.click();document.getElementById('a18PlayerName').value='P4館長';document.getElementById('confirmName').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().playerName==='P4館長'")
   w.wait("Boolean(document.getElementById('startTour'))")
   r.js("document.getElementById('startTour').click()")
   w.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='intro-v1')?.status==='seen'")
   expected=['lv2-v1','lv3-v1','lv4-v1','lv5-v1','lv6-v1','gallery06-complete-v1']
   for room in range(6):
    level=room+1
    r.check('frontier_room_'+str(room),"window.__A18_SCENE_STUDY__.state().galleryIndex",room)
    w.ev("window.__A18_SCENE_STUDY__.showFloorMap()")
    doors(r,level)
    w.capture(f'P4_Lv{level}_map_390x844.png')
    w.ev("document.getElementById('closeFloorMap').click()")
    locked_room=level
    if locked_room<6:
     # Direct calls may throw; verify no change to room or saved progress.
     r.check('reject_direct_locked_'+str(level),f"(async()=>{{try{{await window.__A18_SCENE_STUDY__.changeScene({locked_room});return false}}catch(e){{return e.message==='E_ROOM_LOCKED'}}}})()",True)
     r.check('blocked_stays_in_room_'+str(level),"window.__A18_SCENE_STUDY__.state().galleryIndex",room)
    for i in range(3 if room==0 else 5):
     create_and_hang(w,r,room,i)
     after=level if i<(2 if room==0 else 4) else min(6,level+1)
     r.check(f'level_after_room_{room}_slot_{i}',"window.__A18_SCENE_STUDY__.state().museumLevel",after)
    id=expected[room]
    r.check(f'only_once_{id}',f"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='{id}').length",1)
    r.check('award_once_'+str(room),f"window.__A18_SCENE_STUDY__.p2.persistent().progression.awardedRoomIds.filter(x=>x==={room}).length",1)
    r.check('unchanged_room_after_award_'+str(room),"window.__A18_SCENE_STUDY__.state().galleryIndex",room)
    r.check('queued_visible_'+str(room),"Boolean(document.getElementById('p2EventFinish'))",True)
    w.capture(f'P4_Lv{min(level+1,6)}_event_{id}_390x844.png')
    reload_verify(w,r,min(6,level+1),expect_event=id)
    r.check('queued_still_unique_'+str(room),f"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='{id}'&&e.status==='queued').length",1)
    w.ev("document.getElementById('p2EventFinish').click()")
    w.wait(f"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='{id}')?.status==='seen'")
    r.check('event_seen_'+str(room),f"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id==='{id}').status",'seen')
    if room<5:
     newroom=room+1
     w.ev("window.__A18_SCENE_STUDY__.showFloorMap()")
     r.check('new_badge_persists_'+str(newroom),"Array.from(document.querySelectorAll('.a18-room-tile')).find(e=>e.textContent.includes('展示室0"+str(newroom+1)+"'))?.textContent.includes('NEW')",True)
     w.ev("document.getElementById('closeFloorMap').click()")
     navigate(w,r,newroom)
     r.check('new_notice_not_auto_removed_'+str(newroom),f"window.__A18_SCENE_STUDY__.p2.persistent().progression.newRoomNotices.includes({newroom})",True)
     reload_verify(w,r,newroom+1)
   r.check('exactly_28_exhibited',"window.__A18_SCENE_STUDY__.state().works.filter(w=>w.fixtureId).length",28)
   r.check('final_level_stays_6',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   r.check('awards_exact_six',"JSON.stringify(window.__A18_SCENE_STUDY__.p2.persistent().progression.awardedRoomIds)",'[0,1,2,3,4,5]')
   r.check('events_exact_seven',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length",7)
   r.check('all_open_bidirectional',"Object.values(window.A18Layout.ROOM_LINKS).every((edges,i)=>Object.keys(edges).every(d=>window.A18P2Store.canTraverse(i,d,window.__A18_SCENE_STUDY__.p2.persistent().progression)))",True)
   # Actually traverse every directed link using game changeScene with CAS-save to prove entry/return.
   graph=w.ev("window.__A18_SCENE_STUDY__.state().allRoomLinks")
   for fromid,edges in graph.items():
    navigate(w,r,int(fromid))
    for dest in edges.values():
     r.check('physical_api_edge_'+fromid+'_'+str(dest),f'window.__A18_SCENE_STUDY__.changeScene({dest})',True)
     r.check('physical_api_reverse_'+str(dest)+'_'+fromid,f'window.__A18_SCENE_STUDY__.changeScene({fromid})',True)
   navigate(w,r,5)
   # Remove a finished display and replace it: completion status never regresses.
   w.ev("window.__A18_SCENE_STUDY__.inspect(29)")
   w.ev("document.getElementById('lift').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().carrying==='P4-5-4'")
   r.check('lift_no_level_rollback',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   w.ev("window.__A18_SCENE_STUDY__.inspect(29)")
   w.wait("window.__A18_SCENE_STUDY__.state().carrying===null")
   r.check('rehang_no_double_final',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='gallery06-complete-v1').length",1)
   r.check('rehang_award_stays',"window.__A18_SCENE_STUDY__.p2.persistent().progression.awardedRoomIds.includes(5)",True)
   reload_verify(w,r,6)
   w.capture('P4_Lv6_28frames_final_390x844.png')
   # At Lv6, exchange, store, delete and restart cannot roll back awarded progress.
   w.ev("window.__A18_SCENE_STUDY__.inspect(28)")
   w.ev("document.getElementById('lift').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().carrying==='P4-5-3'")
   r.check('late_lift_keeps_level',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   w.ev("window.__A18_SCENE_STUDY__.inspect(29)")
   w.wait("window.__A18_SCENE_STUDY__.state().carrying==='P4-5-4'")
   r.check('late_exchange_preserves_level',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   r.check('late_exchange_new_frame',"window.__A18_SCENE_STUDY__.state().works.find(w=>w.id==='P4-5-3').fixtureId",'frame-5-4')
   w.ev("document.getElementById('cancel').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().carrying===null")
   r.check('late_storage_keeps_level',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   r.check('late_storage_original_blob',"window.__A18_SCENE_STUDY__.p2.persistent().works.find(w=>w.id==='P4-5-4').originalBlob instanceof Blob",True)
   w.ev("window.__A18_SCENE_STUDY__.list()")
   w.ev("document.querySelector('[data-delete-work=\"P4-5-4\"]').click()")
   w.ev("document.getElementById('confirmDelete').click()")
   w.wait("window.__A18_SCENE_STUDY__.state().works.length===27")
   r.check('late_delete_keeps_level',"window.__A18_SCENE_STUDY__.state().museumLevel",6)
   r.check('late_delete_award_remains',"window.__A18_SCENE_STUDY__.p2.persistent().progression.awardedRoomIds.includes(5)",True)
   r.check('late_delete_no_retrigger',"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.filter(e=>e.id==='gallery06-complete-v1').length",1)
   reload_verify(w,r,6)
   all_results.extend(r.results)
   print('P4 E2E PASS',len(r.results),'Runtime exceptions:',sum(x.get('method')=='Runtime.exceptionThrown' for x in w.console))
   if any(x.get('method')=='Runtime.exceptionThrown' for x in w.console):raise AssertionError('Runtime exceptions recorded')
  finally:
   subprocess.run(['taskkill','/F','/T','/PID',str(process.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
except Exception as e:
 failure=repr(e)
 traceback.print_exc()
finally:
 (ROOT/'p4_full_e2e_results.json').write_text(json.dumps({'passed':sum(x['pass'] for x in all_results),'results':all_results,'failure':failure},ensure_ascii=False,indent=2),encoding='utf-8')
 print('P4 FULL SUMMARY',json.dumps({'passed':sum(x['pass'] for x in all_results),'failure':failure},ensure_ascii=False))
if failure:raise SystemExit(1)
