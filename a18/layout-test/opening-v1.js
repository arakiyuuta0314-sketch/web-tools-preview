/* A18 opening: UI only. Profile persistence belongs to the v3 atomic saver in index.html. */
(() => {
 'use strict';
 const root=document.getElementById('a18OpeningRoot');
 if(!root)throw Error('E_A18_OPENING_ROOT');
 const sceneImages=['scene-01.webp','scene-02.webp','scene-03.webp','scene-04.webp'];
 const beats=[
  {scene:0,speaker:'あなた',text:'…？'},
  {scene:0,speaker:'あなた',text:'ここは…？'},
  {scene:1,speaker:'？？？',text:'……あれ？'},
  {scene:1,speaker:'？？？',text:'誰か、いるの……？'},
  {scene:2,speaker:'？？？',text:'あなたは……誰？'},
  {scene:2,action:'name'},
  {scene:2,speaker:'？？？',text:s=>'……'+s.name+'っていうのね。'},
  {scene:2,speaker:'？？？',text:'……不思議ね。'},
  {scene:2,speaker:'？？？',text:'あなたの姿が、よく見えないの……。'},
  {scene:2,speaker:'？？？',text:'どんな姿をしているの？'},
  {scene:2,action:'gender'},
  {scene:3,speaker:'？？？',text:'……ああ、見えてきた。'},
  {scene:3,speaker:'？？？',text:'え？ ここがどこかって？'},
  {scene:3,speaker:'？？？',text:'うん……そうだよね。'},
  {scene:3,speaker:'？？？',text:'ここはね……'},
  {scene:3,speaker:'？？？',text:'あなたの……'},
  {scene:3,action:'finish'}
 ];
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 let active=false,state=null,typingTimer=0,changing=false,token=0;
 const el=id=>root.querySelector('#'+id);
 function stopTyping(){clearTimeout(typingTimer);typingTimer=0;}
 function deactivate(){stopTyping();active=false;changing=false;token++;root.hidden=true;root.classList.remove('a18-opening-revealing');root.innerHTML='';}
 function title(onStart){
  deactivate();active=true;root.hidden=false;
  root.innerHTML='<section class="a18-opening-frame" aria-label="タイトル画面">'+
   '<div class="a18-opening-title" role="img" aria-label="夕暮れの美術館の外観"></div>'+
   '<button id="a18OpeningStart" class="a18-opening-start" type="button">開始</button></section>';
  el('a18OpeningStart').addEventListener('click',()=>{
   deactivate();
   onStart();
  },{once:true});
 }
 function sceneMarkup(scene){
  return '<section class="a18-opening-frame a18-opening-scene" aria-label="オープニング">'+
    '<div id="a18OpeningVisual" class="a18-opening-visual">'+
      '<img id="a18OpeningImage" class="a18-opening-illustration" src="assets/opening/'+sceneImages[scene]+'" alt="セピア色の風景">'+
      '<div id="a18OpeningVisualCurtain" class="a18-opening-visual-curtain"></div></div>'+
    '<button id="a18OpeningSkip" class="a18-opening-skip" type="button">スキップ</button>'+
    '<div class="a18-opening-dialog" id="a18OpeningDialog" role="button" tabindex="0" aria-label="会話を進める">'+
      '<span id="a18OpeningSpeaker" class="a18-opening-speaker"></span>'+
      '<p id="a18OpeningWords" aria-live="off"></p>'+
      '<div id="a18OpeningForm"></div>'+
      '<span id="a18OpeningNext" class="a18-opening-next" aria-hidden="true"></span></div></section>';
 }
 function bind(){
  el('a18OpeningSkip').onclick=()=>{
   if(changing)return;
   const callback=state.onSkip;
   deactivate();
   callback();
  };
  const d=el('a18OpeningDialog');
  d.onclick=e=>{
   if(e.target.closest('input,button,label'))return;
   void advance();
  };
  d.onkeydown=e=>{
   if(e.target!==d)return;
   if(e.key==='Enter'||e.key===' '){e.preventDefault();void advance();}
  };
 }
 async function transition(nextScene,serial){
  if(changing)return false;
  changing=true;stopTyping();
  const visual=el('a18OpeningVisual'),curtain=el('a18OpeningVisualCurtain');
  // Keep the letterbox, dialogue and controls untouched while the scene changes.
  el('a18OpeningSpeaker').textContent='';
  el('a18OpeningWords').textContent='';
  el('a18OpeningNext').textContent='';
  const next=document.createElement('img');
  next.className='a18-opening-illustration a18-opening-incoming';
  next.alt='セピア色の風景';
  next.src='assets/opening/'+sceneImages[nextScene];
  try{await next.decode();}catch(err){throw Error('E_A18_SCENE_IMAGE '+nextScene)}
  if(serial!==token)return false;
  // The first landscape change has a soft dip; the light scenes crossfade.
  if(nextScene===1){
   curtain.classList.add('dim');
   await sleep(130);
   if(serial!==token)return false;
  }
  visual.insertBefore(next,curtain);
  void next.offsetWidth; // Commit the transparent first frame before fading in.
  next.classList.add('visible');
  await sleep(260);
  if(serial!==token)return false;
  el('a18OpeningImage').remove();
  next.id='a18OpeningImage';
  next.classList.remove('a18-opening-incoming','visible');
  if(nextScene===1){
   curtain.classList.remove('dim');
   await sleep(260);
   if(serial!==token)return false;
  }
  changing=false;
  return true;
 }
 function renderText(beat){
  el('a18OpeningDialog').classList.remove('a18-opening-name-entry');
  const msg=typeof beat.text==='function'?beat.text(state):beat.text;
  const characters=Array.from(msg);
  state.complete=false;state.currentText=msg;
  el('a18OpeningSpeaker').textContent=beat.speaker;
  el('a18OpeningForm').replaceChildren();
  const words=el('a18OpeningWords'),next=el('a18OpeningNext');
  words.textContent='';next.textContent='';
  let index=0;
  stopTyping();
  function write(){
   if(!active||changing||!el('a18OpeningWords'))return;
   index++;
   words.textContent=characters.slice(0,index).join('');
   if(index>=characters.length){stopTyping();state.complete=true;next.textContent='▼'}
   else typingTimer=setTimeout(write,54);
  }
  write();
 }
 function action(beat){
  state.complete=true;stopTyping();
  el('a18OpeningDialog').classList.toggle('a18-opening-name-entry',beat.action==='name');
  el('a18OpeningSpeaker').textContent='？？？';
  el('a18OpeningNext').textContent='';
  const words=el('a18OpeningWords'),slot=el('a18OpeningForm');
  words.textContent='';slot.replaceChildren();
  if(beat.action==='name'){
   words.textContent='あなたの名前を教えてくれる？';
   slot.innerHTML='<label for="a18OpeningName">名前</label><input id="a18OpeningName" maxlength="24" autocomplete="off" placeholder="名前を入力">'+
     '<button id="a18OpeningNameOk" type="button">決定</button><div id="a18OpeningError" class="a18-opening-error" role="alert"></div>';
   function accept(){
    const name=el('a18OpeningName').value.trim();
    if(!name){el('a18OpeningError').textContent='名前を入力してください。';return;}
    state.name=name;
    state.index++;
    void display();
   }
   el('a18OpeningNameOk').onclick=accept;
   el('a18OpeningName').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();accept()}};
   // iOS Safari scrolls the story when an input is automatically focused.
   // Let the player tap the field when ready; no keyboard on scene entry.
  }else if(beat.action==='gender'){
   words.textContent='あなたの姿は……';
   slot.innerHTML='<button id="a18OpeningMale" type="button">男性</button>'+
    '<button id="a18OpeningFemale" type="button">女性</button>';
   for(const [id,value] of [['a18OpeningMale','male'],['a18OpeningFemale','female']]){
    el(id).onclick=()=>{state.gender=value;state.index++;void display();};
   }
  }
 }
 async function finish(){
  if(changing)return;
  changing=true;stopTyping();
  const serial=token,curtain=el('a18OpeningVisualCurtain');
  const illustrated=el('a18OpeningVisual');
  // Brighten the sepia picture first; black bars and dialogue stay in place.
  curtain.classList.add('white');
  await sleep(25);
  if(serial!==token)return;
  curtain.classList.add('visible');
  await sleep(590);
  if(serial!==token)return;
  // Expand a white mask from the central picture to the entire screen.
  const bounds=illustrated.getBoundingClientRect();
  const flash=document.createElement('div');
  flash.id='a18OpeningFullFlash';
  flash.className='a18-opening-full-flash';
  flash.setAttribute('aria-hidden','true');
  flash.style.clipPath='inset('+Math.max(0,bounds.top)+'px '+
    Math.max(0,window.innerWidth-bounds.right)+'px '+
    Math.max(0,window.innerHeight-bounds.bottom)+'px '+
    Math.max(0,bounds.left)+'px)';
  root.appendChild(flash);
  void flash.offsetWidth;
  flash.classList.add('expanded');
  await sleep(1000);
  if(serial!==token)return;
  // Mount the coloured museum behind solid white before gently revealing it.
  const complete=state.onComplete,result={name:state.name,gender:state.gender};
  complete(result);
  await sleep(100);
  if(serial!==token)return;
  root.classList.add('a18-opening-revealing');
  await sleep(1150);
  if(serial!==token)return;
  deactivate();
 }
 async function display(){
  if(!active||changing||!state)return;
  const beat=beats[state.index];
  if(!beat)throw Error('E_A18_OPENING_INDEX');
  if(beat.scene!==state.scene){
   const serial=token;
   if(!await transition(beat.scene,serial))return;
   state.scene=beat.scene;
  }
  if(beat.action==='finish'){await finish();return;}
  if(state.replay&&(beat.action==='name'||beat.action==='gender')){
   state.index++;
   await display();return;
  }
  if(beat.action){action(beat);return;}
  renderText(beat);
 }
 async function advance(){
  if(!active||changing||!state)return;
  const beat=beats[state.index];
  if(beat.action)return;
  if(!state.complete){
   stopTyping();
   state.complete=true;
   el('a18OpeningWords').textContent=state.currentText;
   el('a18OpeningNext').textContent='▼';
   return;
  }
  state.index++;
  await display();
 }
 function start({onComplete,onSkip,preset=null}){
  if(typeof onComplete!=='function'||typeof onSkip!=='function')throw Error('E_A18_OPENING_CALLBACK');
  if(preset&&(!preset.name||!['male','female'].includes(preset.gender)))throw Error('E_A18_REPLAY_PROFILE');
  deactivate();active=true;root.hidden=false;
  state={index:0,scene:0,name:preset?.name||'',gender:preset?.gender||'',replay:Boolean(preset),complete:false,onComplete,onSkip};
  root.innerHTML=sceneMarkup(0);
  bind();void display();
 }
 window.A18Opening={title,start,isActive:()=>active};
})();
