from pathlib import Path
import shutil, json
p=Path(r'C:\Users\User\source\repos\web-tools-preview-a18-p6\a18\layout-test')
src=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\06_P6_ストーリー先行制作\A18_P6_イベント台本データ_v1.0_20261023.json')
data=json.loads(src.read_text('utf-8'))
assert [x['eventId'] for x in data['events']]==['intro-v1','lv2-v1','lv3-v1','lv4-v1','lv5-v1','lv6-v1','gallery06-complete-v1']
shutil.copy2(src,p/'p6-event-dialogue-v1.json')
page=p/'index.html'
s=page.read_text('utf-8')
def change(a,b):
 global s
 assert s.count(a)==1,(a[:65],s.count(a))
 s=s.replace(a,b)
change('<link rel="stylesheet" href="rpg-chat.css?v=1.6">','<link rel="stylesheet" href="rpg-chat.css?v=1.6"><link rel="stylesheet" href="p6-story.css?v=1">')
start=s.index('let p6Dialogues=null;')
end=s.index('function butlerDialog(){',start)
insert=r"""let p6Dialogues=null, storyBusy=false;
function eventData(id){
 const data=p6Dialogues?.events.find(e=>e.eventId===id);
 if(!data)throw Error('E_P6_EVENT_UNKNOWN '+id);
 return data;
}
function storyActor(data){
 return data.actors[0]==='butler'?'butler':'staff';
}
function storyLine(line){
 const butlerName=window.A18Registration.honorific('butler',playerName,avatarGender);
 const staffName=window.A18Registration.honorific('staff',playerName,avatarGender);
 return String(line).replaceAll('{playerHonorific}',butlerName)
  .replaceAll('{playerStaffName}',staffName).replaceAll('{museumTitle}',museumTitle);
}
function storyPortrait(role,message){
 const person=role==='butler'?'爺や':'展示室スタッフ';
 const meta=window.A18Art.manifest?.[role];
 if(!meta?.portraitPath)throw Error('E_P6_PORTRAIT_MISSING '+role);
 return '<div class="rpg-chat p6-story-chat"><div class="rpg-portrait"><img src="'+esc(meta.portraitPath)+'" alt="'+esc(person)+'"></div>'+
 '<div class="rpg-words"><span class="rpg-name">'+esc(person)+'</span><p class="rpg-message">'+esc(storyLine(message))+'</p></div></div>';
}
function storyFailure(){
 const error=$('p6EventError');
 if(error)error.textContent='保存できませんでした。会話の既読状態は更新していません。再読み込みして再開してください。';
 const retry=$('p6Reload');
 if(retry)retry.hidden=false;
}
function storySuccess(){
 showingEvent=false;
 close();
 if(!saveBlocked)showProgressionEvent();
}
async function storyCommit(id,action){
 if(storyBusy||saving||saveBlocked)return;
 storyBusy=true;
 try{
  if(await commitEventAction(action,id)){storySuccess();}
  else storyFailure();
 }finally{storyBusy=false;}
}
function queuedProgressionEvent(){
 return currentSave?.progression.events.find(e=>e.status==='queued'&&e.id!=='intro-v1')||null;
}
function storySession(event,fromHistory=false){
 const data=eventData(event.id),role=storyActor(data);
 if(!Array.isArray(data.lines)||data.lines.length<1)throw Error('E_P6_LINES');
 return {id:event.id,data,role,index:0,fromHistory};
}
function renderStoryPage(session){
 const {id,data,role,index,fromHistory}=session;
 const isFinal=id==='gallery06-complete-v1';
 const header=isFinal?'展示室06 完成記念':data.systemText;
 const mode=fromHistory?'会話の記録':'美術館のできごと';
 const body='<div class="p6-story-meta">'+esc(mode)+'　'+(index+1)+' / '+data.lines.length+'</div>'+
  '<h3 class="p6-story-title">'+esc(header)+'</h3>'+storyPortrait(role,data.lines[index])+
  '<p id="p6EventError" class="error" role="alert"></p>'+
  '<div class="p6-story-actions">'+
  (index<data.lines.length-1?'<button id="p6Next" type="button">次の会話へ ▼</button>':'')+
  '<button id="p2EventFinish" type="button">'+(fromHistory?'読み終える':'会話を終える')+'</button>'+
  '<button id="p2EventSkip" type="button" class="light">'+(fromHistory?'一覧に戻る':'あとで読む')+'</button>'+
  '<button id="p6Reload" type="button" class="light" hidden>再読み込みして復帰</button></div>';
 open(fromHistory?'美術館の物語':header,body,'rpg');
 if($('p6Next'))$('p6Next').onclick=()=>{
  if(storyBusy)return;session.index++;renderStoryPage(session);
 };
 $('p2EventFinish').onclick=()=>{
  const event=currentSave.progression.events.find(e=>e.id===id);
  if(fromHistory&&event.status==='seen'){showingEvent=false;showStoryHistory();return;}
  void storyCommit(id,'finish');
 };
 $('p2EventSkip').onclick=()=>{
  const event=currentSave.progression.events.find(e=>e.id===id);
  if(fromHistory){showingEvent=false;showStoryHistory();return;}
  if(event.status==='queued')void storyCommit(id,'skip');
 };
 $('p6Reload').onclick=()=>location.reload();
}
function showProgressionEvent(id=null,options={}){
 if(showingEvent||modal||saveBlocked||!p6Dialogues)return;
 const ev=id?currentSave?.progression.events.find(e=>e.id===id):queuedProgressionEvent();
 if(!ev)return;
 const fromHistory=options.replay===true;
 if(!fromHistory&&ev.status!=='queued')return;
 const data=eventData(ev.id);
 // Automatic scene dialogue is allowed only in the actor's real source room.
 if(!fromHistory&&galleryIndex!==data.sourceRoomId)return;
 if(ev.id==='intro-v1'){
  if(!playerName)showIntroOpening();
  else showIntroAfterProfile();
  return;
 }
 showingEvent=true;
 renderStoryPage(storySession(ev,fromHistory));
}
function showIntroOpening(){
 if(showingEvent||modal||saveBlocked)return;
 const intro=eventData('intro-v1');
 if(!currentSave.progression.events.some(e=>e.id==='intro-v1'&&e.status==='queued'))return;
 showingEvent=true;
 let index=0;
 function render(){
  const steps=intro.steps.filter(step=>['O01','O02','O03'].includes(step.step));
  open('とっておき美術館へ、ようこそ',
   '<div class="p6-story-meta">はじまりの物語　'+(index+1)+' / '+steps.length+'</div>'+
   storyPortrait('butler',steps[index].text)+
   '<div class="p6-story-actions"><button id="introNext">'+(index===2?'館長になる':'次へ ▼')+'</button>'+
   '<button id="introSkipOpening" class="light">オープニングをスキップ</button></div>','rpg');
  function profile(){showingEvent=false;close();onboarding();}
  $('introNext').onclick=()=>{if(index<2){index++;render();}else profile();};
  $('introSkipOpening').onclick=profile;
 }
 render();
}
function showIntroAfterProfile(){
 if(showingEvent||modal||saveBlocked||!playerName)return;
 const ev=currentSave.progression.events.find(e=>e.id==='intro-v1');
 if(!ev||ev.status!=='queued')return;
 showingEvent=true;
 const steps=eventData('intro-v1').steps.filter(step=>['O06','O07'].includes(step.step));
 let index=0;
 function render(){
  open('ようこそ、館長',
   '<div class="p6-story-meta">館長の登録が完了しました　'+(index+1)+' / '+steps.length+'</div>'+
   storyPortrait('butler',steps[index].text)+
   '<p id="p6EventError" class="error" role="alert"></p>'+
   '<div class="p6-story-actions">'+(index===0?'<button id="introNext">次へ ▼</button>':'')+
   '<button id="startTour">はじめる</button><button id="skipTour" class="light">案内をとばす</button>'+
   '<button id="p6Reload" class="light" hidden>再読み込みして復帰</button></div>','rpg');
  if($('introNext'))$('introNext').onclick=()=>{index=1;render();};
  $('startTour').onclick=()=>{void storyCommit('intro-v1','finish');};
  $('skipTour').onclick=()=>{void storyCommit('intro-v1','skip');};
  $('p6Reload').onclick=()=>location.reload();
 }
 render();
}
function showStoryHistory(){
 if(saveBlocked)return;
 showingEvent=false;
 const eventList=currentSave.progression.events;
 const rows=eventList.map(ev=>{
  const data=eventData(ev.id);
  const name=ev.id==='intro-v1'?'はじまりの物語':
   ev.id==='gallery06-complete-v1'?'展示室06 完成記念':
   '館Lv.'+data.levelAfter+'　'+ROOM_LABELS[data.openedRoomId]+'開放';
  const state=ev.status==='seen'?'既読':ev.status==='available'?'あとで読む':'未読';
  return '<button class="p6-story-entry" type="button" data-p6-replay="'+esc(ev.id)+'"><span>'+esc(name)+'</span><small>'+state+'</small></button>';
 }).join('');
 open('美術館の物語','<div class="p6-history"><p class="small">これまでの会話を読み返せます。展示やレベルには影響しません。</p>'+
  (rows||'<p>まだ物語はありません。</p>')+
  '<button id="p6HistoryBack" type="button" class="light">設定に戻る</button></div>');
 for(const item of document.querySelectorAll('[data-p6-replay]'))item.onclick=()=>{
  const id=item.dataset.p6Replay;
  close();
  showProgressionEvent(id,{replay:true});
 };
 $('p6HistoryBack').onclick=()=>{close();showSettings();};
}
"""
s=s[:start]+insert+s[end:]
change("  await P2.commit(null,state);\n }\n P2.validate(state);","  state.progression.events.push({id:'intro-v1',origin:'play',status:'queued'});\n  await P2.commit(null,state);\n }\n P2.validate(state);")
change(" if(!playerName)onboarding();else showProgressionEvent();"," if(!playerName){\n  if(currentSave.progression.events.some(e=>e.id==='intro-v1'&&e.status==='queued'))showIntroOpening();\n  else onboarding();\n }else if(currentSave.progression.events.some(e=>e.id==='intro-v1'&&e.status==='queued'))showIntroAfterProfile();\n else showProgressionEvent();")
start=s.index('function onboarding(){')
end=s.index('function showSettings(){',start)
s=s[:start]+r"""function onboarding(){
 if(showingEvent||saveBlocked)return;
 open('あなたの美術館をはじめよう','<p>館長のお名前・姿・美術館名を決めましょう。必須の設定です。</p>'+
  profileFields()+'<p id="profileError" class="error" role="alert"></p>'+
  '<div class="row"><button id="confirmName">この設定ではじめる</button></div>');
 $('confirmName').onclick=async()=>{
  if(saving||saveBlocked)return;
  if(!await saveProfile()){
   if(saveBlocked)$('profileError').textContent='保存できませんでした。再読み込み後、プロフィールを確認してください。';
   return;
  }
  close();
  showIntroAfterProfile();
 };
}
""" +s[end:]
change("function showSettings(){\n open(","function showSettings(){\n if(showingEvent||saveBlocked)return;\n open(")
change("  '<p id=\"profileError\" class=\"error\" role=\"alert\"></p><div class=\"row\"><button id=\"saveProfile\">変更を保存</button><button id=\"closeSettings\" class=\"light\">戻る</button></div>'+","  '<p id=\"profileError\" class=\"error\" role=\"alert\"></p><div class=\"row\"><button id=\"saveProfile\">変更を保存</button><button id=\"closeSettings\" class=\"light\">戻る</button></div>'+")
change("  '<hr><h3>広告</h3><button id=\"adRemoval\"","  '<hr><h3>物語</h3><button id=\"p6StoryHistory\" type=\"button\" class=\"light\">美術館の物語</button>'+ \n  '<hr><h3>広告</h3><button id=\"adRemoval\"")
change(" $('closeSettings').onclick=close;\n\n}"," $('closeSettings').onclick=close;\n $('p6StoryHistory').onclick=()=>{close();showStoryHistory();};\n\n}")
change("function walk(dir){","function walk(dir){\n if(modal||showingEvent||saveBlocked)return false;")
change("async function changeScene(next,options={}){","async function changeScene(next,options={}){\n if(modal||showingEvent||saveBlocked)return false;")
change("function action(){\n const h=nearby();","function action(){\n if(modal||showingEvent||saveBlocked)return;\n const h=nearby();")
change("function showFloorMap(){\n open(","function showFloorMap(){\n if(modal||showingEvent||saveBlocked)return;\n open(")
change(" state:()=>({scene,"," state:()=>({scene,")
change(" move:walk,canMove:safeMove,changeScene,inspect,form,list,showFloorMap,showSettings,staffDialog,butlerDialog,checkPortal,portalEdges:PORTAL_EDGES,"," move:walk,canMove:safeMove,changeScene,inspect,form,list,showFloorMap,showSettings,showStoryHistory,showProgressionEvent,staffDialog,butlerDialog,checkPortal,portalEdges:PORTAL_EDGES,")
page.write_text(s,'utf-8')
(p/'p6-story.css').write_text(r"""/* P6 narrative overlay: portrait from existing canonical manifest, never synthetic actors. */
.p6-story-meta{font-size:12px;color:#566c5c;font-weight:750;letter-spacing:.04em;margin-bottom:5px}
.p6-story-title{font-size:17px;line-height:1.5;color:#274c3b;margin:2px 0 12px;overflow-wrap:anywhere}
.p6-story-chat .rpg-message{overflow-wrap:anywhere;white-space:pre-wrap}
.p6-story-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}
.p6-story-actions button{flex:1 1 125px;min-width:0}
.p6-history{display:grid;gap:8px}
.p6-story-entry{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;background:#f1e8d2!important;color:#2c4c3d!important;border:1px solid #c6b689;min-height:52px;overflow-wrap:anywhere}
.p6-story-entry span{min-width:0}
.p6-story-entry small{font-size:12px;white-space:nowrap;color:#536a5c;border:1px solid #b1c2b1;border-radius:6px;padding:3px 5px}
#p6EventError:empty{display:none}
@media(max-width:420px){.p6-story-actions button{font-size:14px}.p6-story-chat .rpg-message{font-size:16px}}
""",'utf-8')
print('P6_INTEGRATED',len(s),[x['eventId'] for x in data['events']])
