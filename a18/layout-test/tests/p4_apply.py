"""P4 patch: strictly scoped on isolated P2 base; leave v2 and artwork untouched."""
from pathlib import Path
import hashlib, shutil, json
root=Path(__file__).resolve().parents[1]
drive=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館')
source=drive/'06_P6_ストーリー先行制作'/'A18_P6_イベント台本データ_v1.0_20261023.json'
target=root/'p6-event-dialogue-v1.json'
shutil.copyfile(source,target)
assert hashlib.sha256(source.read_bytes()).hexdigest()==hashlib.sha256(target.read_bytes()).hexdigest()
assert len(json.loads(target.read_text('utf-8'))['events'])==7

def patch(name,parts):
 p=root/name
 content=p.read_text('utf-8')
 for before,after in parts:
  qty=content.count(before)
  if qty!=1: raise RuntimeError(f'Unexpected match {name} count={qty}: {before[:65]!r}')
  content=content.replace(before,after,1)
 p.write_text(content,encoding='utf-8',newline='\n')
 print('PATCH',name,len(parts))

storage_old=""" // P2 only: Lv2 -> Lv3 is intentionally outside scope.
 if(room===0&&!before.progression.awardedRoomIds.includes(0)
   &&!isRoomComplete(0,before.fixtures,before.works)&&isRoomComplete(0,next.fixtures,next.works)){
  next.progression.unlockedThroughLevel=2;
  next.progression.awardedRoomIds.push(0);
  next.progression.newRoomNotices.push(1);
  next.progression.events.push({id:'lv2-v1',origin:'play',status:'queued'});
  transition={completedRoomId:0,openedRoomId:1,eventId:'lv2-v1',kind:'level'};
 }"""
storage_new=""" // Progress only on first completion of the current frontier, up to six rooms.
 if(!before.progression.awardedRoomIds.includes(room)
   &&!isRoomComplete(room,before.fixtures,before.works)
   &&isRoomComplete(room,next.fixtures,next.works)){
  const isFinal=room===5,openedRoomId=isFinal?null:room+1;
  const eventId=isFinal?'gallery06-complete-v1':'lv'+(room+2)+'-v1';
  if(next.progression.events.some(e=>e.id===eventId))throw error('E_EVENT_DUPLICATE');
  next.progression.awardedRoomIds.push(room);
  if(!isFinal){
   next.progression.unlockedThroughLevel=room+2;
   next.progression.newRoomNotices.push(openedRoomId);
  }
  next.progression.events.push({id:eventId,origin:'play',status:'queued'});
  transition={completedRoomId:room,openedRoomId,eventId,kind:isFinal?'final':'level'};
 }"""
patch('museum-p2-storage.js',[(storage_old,storage_new),('/* A18 P2 isolated schema-v3 store. Never reads, upgrades or deletes schema-v2. */','/* A18 P4 isolated schema-v3 store. Never reads, upgrades or deletes schema-v2. */')])
patch('museum-navigation.js',[
("const n=Number(entry),chosen=n===room,locked=n>=opened;", "const n=Number(entry),chosen=n===room,locked=n>=opened,notice=!locked&&progression.newRoomNotices.includes(n);"),
("':'<span>開放済み</span>')+'</div>');","':'<span>開放済み'+(notice?' · NEW':'')+'</span>')+'</div>');")
])
f=root/'index.html'
s=f.read_text(encoding='utf-8')
start=s.index('async function commitEventAction(action){')
end=s.index('function butlerDialog(){',start)
old=s[start:end]
new="""async function commitEventAction(action,id=null){
 if(saving||saveBlocked)return false;
 saving=true;
 try{
  const eventId=id||currentSave.progression.events.find(e=>e.status==='queued')?.id;
  if(!eventId)throw Error('E_EVENT_UNKNOWN');
  const next=P2.eventAction(currentSave,eventId,action);
  await P2.commit(currentSave.revision,next);
  applyCommitted(next);return true;
 }catch(e){saveError(e);return false}
 finally{saving=false}
}
let p6Dialogues=null;
function queuedProgressionEvent(){
 return currentSave?.progression.events.find(e=>e.status==='queued'&&e.id!=='intro-v1')||null;
}
function showProgressionEvent(id=null){
 if(showingEvent||modal||saveBlocked||!p6Dialogues)return;
 const ev=id?currentSave?.progression.events.find(e=>e.id===id):queuedProgressionEvent();
 if(!ev||ev.status!=='queued')return;
 const data=p6Dialogues.events.find(e=>e.eventId===ev.id);
 if(!data)throw Error('E_P6_EVENT_UNKNOWN');
 showingEvent=true;
 const isFinal=ev.id==='gallery06-complete-v1';
 const actor=data.actors[0]==='butler'?'爺や':'展示室スタッフ';
 const honorificRole=data.actors[0]==='butler'?'butler':'staff';
 const playerHonorific=window.A18Registration.honorific(honorificRole,playerName,avatarGender);
 const substitute=text=>text.replaceAll('{playerHonorific}',playerHonorific).replaceAll('{playerStaffName}',playerHonorific);
 // Final commemorative wording is not approved: display event ID and a neutral placeholder only.
 const body=isFinal
  ?'<p>展示室06の5枠が完成しました。最終達成記録が保存されました。</p>'+
   '<p class="small">正式な記念演出・台詞は監修待ちです。</p>'
  :data.lines.map(line=>'<p>'+esc(actor)+'「'+esc(substitute(line))+'」</p>').join('');
 open(isFinal?'展示室06が完成しました':ROOM_LABELS[data.openedRoomId]+'が開きました',
  '<h3>'+esc(isFinal?'展示室06 完成（仮通知）':data.systemText)+'</h3>'+body+
  (!isFinal?'<p class="small">館内を歩いて、開いた展示室へ進めます。</p>':'')+
  '<div class="row"><button id="p2EventFinish">ありがとう</button><button id="p2EventSkip" class="light">あとで読む</button></div>');
 for(const [buttonId,action] of [['p2EventFinish','finish'],['p2EventSkip','skip']]){
  $(buttonId).onclick=async()=>{
   if(await commitEventAction(action,ev.id)){showingEvent=false;close();showProgressionEvent();}
  };
 }
}
"""
s=s[:start]+new+s[end:]
parts=[
(" if(event&&result.transition?.eventId==='lv2-v1')showLv2Event();"," if(event&&result.transition?.eventId)showProgressionEvent(result.transition.eventId);"),
(" if(!playerName)onboarding();else if(currentSave.progression.events.some(e=>e.id==='lv2-v1'&&e.status==='queued'))showLv2Event();"," if(!playerName)onboarding();else showProgressionEvent();"),
(" P2.validate(state);\n applyCommitted(state);"," P2.validate(state);\n const p6Response=await fetch('p6-event-dialogue-v1.json');\n if(!p6Response.ok)throw Error('E_P6_DIALOGUE_LOAD');\n p6Dialogues=await p6Response.json();\n const eventIds=['intro-v1','lv2-v1','lv3-v1','lv4-v1','lv5-v1','lv6-v1','gallery06-complete-v1'];\n if(p6Dialogues.version!=='1.0'||JSON.stringify(p6Dialogues.events.map(e=>e.eventId))!==JSON.stringify(eventIds))throw Error('E_P6_DIALOGUE_SCHEMA');\n applyCommitted(state);"),
("overlay.onclick=e=>{if(e.target===overlay)close()};","overlay.onclick=e=>{if(e.target===overlay&&!showingEvent)close()};"),
("<script src=\"museum-p2-storage.js?v=p2a\"></script>","<script src=\"museum-p2-storage.js?v=p4a\"></script>")
]
for before,after in parts:
 if s.count(before)!=1:raise RuntimeError(f'index unexpected {s.count(before)} {before[:70]}')
 s=s.replace(before,after,1)
f.write_text(s,encoding='utf-8',newline='\n')
print('PATCH index.html',len(parts)+1)
print('P6 SHA256',hashlib.sha256(target.read_bytes()).hexdigest())
