/* A18 receptionist: randomized human dialogue and opt-in photo finishing. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hellos=[
 'いらっしゃいませ。新しい作品をお預かりしましょうか？',
 'おかえりなさいませ、館長。今日はどんな一枚に出会えるのでしょう。',
 '展示室の準備は整っております。作品のご相談ですか？',
 '館長がお越しになると、館内が明るくなる気がいたします。',
 'お待ちしておりました。新しい作品が加わるのが楽しみです。',
 '今日も素敵な一日ですね。私にお手伝いできることはございますか？'
];
const compliments=[
 '今回の新作も素晴らしい……',
 'なんと美しい……すぐに飾りたくなりますね！',
 'これは素敵な一枚ですね。展示室が華やぎそうです。',
 'ひと目で心を奪われました。大切にお預かりします。',
 'こんな作品と出会えるなんて、受付冥利に尽きます。',
 'お見事です！ 飾るのが今から楽しみになりました。',
 'この作品にぴったりの額装を考えたいですね。'
];
const doneLines=[
 '写真の仕上げができました。ここからは館長の出番ですね。',
 '丁寧に仕上げました。どの額縁に飾りましょうか？',
 'またひとつ、素敵な作品をお迎えできましたね。',
 '館長、作品のご用意が整いました。大切にお渡しします。',
 'お預かりした作品の仕上げが終わりました。いよいよ展示ですね。'
];
const last=new Map();
function pick(tag,arr){
 const previous=last.get(tag);let i=Math.floor(Math.random()*arr.length);
 if(i===previous&&arr.length>1)i=(i+1+Math.floor(Math.random()*(arr.length-1)))%arr.length;
 last.set(tag,i);return arr[i];
}
let activeRole='staff',activePlayer='館長';
function honorific(role,playerName,gender){
 const n=(playerName||'館長').trim();
 if(role==='butler')return n+(gender==='female'?'お嬢様':'様');
 return n+'さん';
}
function portrait(message,role=activeRole){
 const butler=role==='butler',meta=window.A18Art?.manifest?.[butler?'butler':'staff'];
 return '<div class="rpg-chat"><div class="rpg-portrait"><img src="'+esc(meta?.portraitPath||'')+'" alt="'+(butler?'爺や':'スタッフ')+'"></div>'+
 '<div class="rpg-words"><span class="rpg-name">'+(butler?'爺や':'展示室スタッフ')+'</span>'+
 '<p class="rpg-message">'+esc(message)+'</p></div></div>';
}
function staffPortrait(message){return portrait(message);}
function reviewLayout(message,media,choices){
 return '<div class="rpg-review">'+
 '<section class="rpg-attachment" aria-label="写真と展示前の確認">'+media+'</section>'+
 '<section class="rpg-review-dialogue">'+portrait(message)+
 '<div class="rpg-choices">'+choices+'</div></section></div>';
}
const CHAT_BUTLER=[
 '{name}、本日も素晴らしい美術館でございますね。',
 'こちらの美術館は、{name}の大切な思い出で満ちております。',
 '作品を一枚ずつ飾られるお姿に、私も誇らしい気持ちになります。',
 '{title}、実に見事な作品でございます。館内を明るくしてくれますね。',
 '{title}には、{name}ならではの素敵な思い出が込められておりますね。'
];
const CHAT_STAFF=[
 '{name}、今日も来てくれてうれしいです！',
 'どの作品も素敵で、見ているだけで楽しくなっちゃいます。',
 '新しい作品が増えるたび、この展示室がもっと好きになります！',
 '「{title}」って、素敵な名前ですね！',
 '「{title}」、つい何度も見に行っちゃいます。大好きです！'
];
function chatText(role,playerName,gender,works){
 const list=role==='butler'?CHAT_BUTLER:CHAT_STAFF;
 const choices=works?.length?list:list.filter(t=>!t.includes('{title}'));
 const text=pick('chat-'+role,choices),name=honorific(role,playerName,gender);
 const title=works?.length?works[Math.floor(Math.random()*works.length)].title:'';
 const line=text.replaceAll('{name}',name).replaceAll('{title}',title);
 return line.includes(name)?line:name+'、'+line;
}
function staffDialog({open,close,list,form,carrying,role='staff',playerName='館長',gender='male',works=[]}){
 const butler=role==='butler',title=butler?'爺や':'展示室スタッフ';
 const name=honorific(role,playerName,gender);
 activeRole=role;activePlayer=name;
 const intro=butler
  ?name+'、お呼びでございますか。何なりとお申し付けください。'
  :name+'、おかえりなさい！ 今日はどうする？';
 function speak(text,choices=''){return portrait(text,role)+choices;}
 function menu(){
  open(title,speak(intro,'<div class="rpg-choices">'+
   '<button id="staffRegister">新しい作品を預ける</button>'+
   '<button id="all">作品の一覧を見る</button>'+
   '<button id="staffChat">世間話</button>'+
   '<button id="close" class="light">またあとで</button></div>'),'rpg');
  $('staffRegister').onclick=()=>{
   if(carrying){
    open(title,speak(butler
      ?name+'、お持ちの作品を飾るか保管されましたら、次の一枚も喜んでお預かりいたします。'
      :name+'、その作品もすごく素敵！ 飾るか保管したら次の一枚も見せてね。',
      '<div class="rpg-choices"><button id="returnMenu">わかりました</button><button id="close" class="light">戻る</button></div>'),'rpg');
    $('returnMenu').onclick=menu;$('close').onclick=close;return;
   }
   form(0,true,role);
  };
  $('all').onclick=list;
  $('staffChat').onclick=()=>{
   open(title,speak(chatText(role,playerName,gender,works),
    '<div class="rpg-choices"><button id="staffChatAgain">もっと話す</button><button id="returnMenu">用件を選ぶ</button><button id="close" class="light">またあとで</button></div>'),'rpg');
   $('staffChatAgain').onclick=()=>$('staffChat').onclick();
   $('returnMenu').onclick=menu;$('close').onclick=close;
  };
  $('close').onclick=close;
 }
 open(title,'<button type="button" id="rpgAdvance" class="rpg-dialogue-advance" aria-label="次の会話へ進む">'+
  speak(butler?pick('butler-hi',[
   name+'、本日もお目にかかれて光栄でございます。',
   name+'、館内のご案内は私にお任せください。'
  ]):pick('staff-hi',[
   name+'、いらっしゃい！ 今日も楽しんでいってね。',
   name+'、会えてうれしい！ 作品を見せてくれる？'
  ]))+
  '<span class="rpg-tap-next">▼ タップでつづく</span></button>','rpg');
 $('rpgAdvance').onclick=menu;
}
function form({spotNo=0,viaStaff=false,open,close,works,onRegistered,changeScene,maxWorks=50,role='staff',playerName='館長',gender='male'}){
 activeRole=role;activePlayer=honorific(role,playerName,gender);
 const ctx={spotNo,viaStaff,open,close,works,onRegistered,changeScene};
 if(works.length>=maxWorks){open('作品の登録上限','<p>'+maxWorks+'作品に達しました。別フロアへの増築は今後のアップデートで検討します。</p><div class="row"><button id="close">閉じる</button></div>');$('close').onclick=close;return;}
 open(role==='butler'?'爺や｜作品のお預かり':'スタッフ｜作品のお預かり',
 '<div class="registration-intro">'+staffPortrait(role==='butler'?activePlayer+'、大切な作品をお預かりいたします。':'新しい作品を預かるね！')+'</div>'+
 '<div class="registration-fields">'+
 '<label>作品名<input id="name" maxlength="80" placeholder="例：お気に入りの風景"></label>'+
 '<label>完成日（任意：不明なら今日を選択）<input id="date" type="date"></label>'+
 '<div class="date-actions"><button type="button" id="dateClear" class="light">不明</button><button type="button" id="dateToday" class="light">今日</button></div>'+
 '<label>ピース数（任意）<input id="pieces" type="number" min="1" max="999999"></label>'+
 '<label>備考・思い出（任意）<textarea id="notes" maxlength="3000" rows="2" placeholder="作品にまつわる思い出を自由に残せます"></textarea></label>'+
 '<label>写真<input id="photo" type="file" accept="image/*"></label></div>'+
 '<p class="prep-warn">この端末のブラウザに保存します。原本写真は変更しません。ブラウザのデータ消去やプライベートモードでは失われる場合があります。</p>'+
 '<p id="err" class="error"></p><div class="row registration-actions"><button id="save">作品を預ける</button><button id="close" class="light">キャンセル</button></div>');
 document.getElementById('dialog').classList.add('registration-compact');
 const today=()=>{
   const d=new Date();
   return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 };
 $('date').value=today();
 $('dateToday').onclick=()=>{$('date').value=today();};
 $('dateClear').onclick=()=>{$('date').value='';};
 $('close').onclick=close;
 $('save').onclick=()=>{
  const file=$('photo').files?.[0],name=$('name').value.trim();
  const complete=$('date').value||null;
  if(!name||!file){$('err').textContent='作品名と写真を選んでください';return}
  if(!file.type.startsWith('image/')){$('err').textContent='画像を選択してください';return}
  if(file.size>30*1024*1024){$('err').textContent='30MB以下の画像を選んでください';return}
  const originalURL=URL.createObjectURL(file),image=new Image();
  const entry={title:name,pieces:Number($('pieces').value)||null,complete,
   notes:$('notes').value.trim(),registered:today(),fixtureId:null,image,originalURL,originalBlob:file};
  image.onload=()=>offer(ctx,entry);
  image.onerror=()=>{URL.revokeObjectURL(originalURL);$('err').textContent='写真を読み込めませんでした'};
  image.src=originalURL;
 };
}
function offer(ctx,entry){
 const {open,close}=ctx;
 const attachments=
  '<div class="prep-pair"><div class="prep-preview" style="grid-column:1/-1"><strong>お預かりした写真</strong><img id="offerOriginal" alt="元の写真" src="'+esc(entry.originalURL)+'"></div></div>'+
  '<p class="prep-warn">必要な範囲だけ調整をご提案します。元の写真はそのまま残し、仕上がりを確認してから選べます。</p>';
 open(activeRole==='butler'?'爺や｜展示前のご相談':'スタッフ｜展示前のご相談',
  reviewLayout(pick('praise',compliments)+(activeRole==='butler'?' よろしければ、私が額装に向けて整えましょう。':' ちょっとだけ色味を整えてみてもいい？'),
   attachments,
   '<button id="offerYes">仕上がりを見たい</button><button id="offerNo" class="light">元の写真を使う</button>'),'rpg');
 $('offerYes').onclick=()=>compare(ctx,entry);
 $('offerNo').onclick=()=>commit(ctx,entry,null);
}
function commit(ctx,entry,canvas){
 const {open,close,works,onRegistered}=ctx;
 function previewThumb(){
  const source=canvas||entry.image,w=source.width,h=source.height;
  const thumb=document.createElement('canvas');thumb.width=176;thumb.height=132;
  const t=thumb.getContext('2d');t.fillStyle='#e7dcc8';t.fillRect(0,0,176,132);
  t.imageSmoothingEnabled=true;t.imageSmoothingQuality='high';
  const scale=Math.min(176/w,132/h);
  t.drawImage(source,(176-w*scale)/2,(132-h*scale)/2,w*scale,h*scale);
  return thumb.toDataURL('image/jpeg',.82);
 }
 const thumbnail=previewThumb();
 const id='local-'+Date.now()+'-'+Math.floor(Math.random()*100000);
 const aspect=entry.image.naturalWidth/entry.image.naturalHeight;
 const preferredShape=aspect<.85?'portrait':aspect>1.15?'landscape':'square';
 works.push({id,preferredShape,title:entry.title,pieces:entry.pieces,complete:entry.complete,notes:entry.notes,
  registered:entry.registered,originalURL:entry.originalURL,originalBlob:entry.originalBlob,
  displaySrc:canvas?canvas.toDataURL('image/jpeg',.94):entry.originalURL,
  thumbnail,fixtureId:null,source:null});
 open(activeRole==='butler'?'爺や｜作品のお渡し':'スタッフ｜作品のお渡し',
  '<div class="rpg-chat"><div class="rpg-portrait"><img src="'+esc(window.A18Art?.manifest?.[activeRole==='butler'?'butler':'staff']?.portraitPath||'')+'" alt="スタッフ"></div><div class="rpg-words"><span class="rpg-name">'+(activeRole==='butler'?'爺や':'展示室スタッフ')+'</span><p class="rpg-message">'+esc(pick('done',[
    '丁寧に仕上げました。どうぞ、館長。お好きな場所へ飾ってください！',
    '今回の新作、お預かりしました。額縁までは館長にお願いしてもよろしいですか？',
    '美しく仕上がりました。ぜひ館長ご自身の手で飾ってください。',
    ...doneLines.map(t=>t+' 作品をお渡ししますね。')
  ]))+'</p></div></div>'+
  '<div class="rpg-choices"><button id="receiveWork">作品を受け取る ▼</button></div>', 'rpg');
 $('receiveWork').onclick=()=>{close();onRegistered(id);};
}
function compare(ctx,entry){
 const full={x:0,y:0,w:entry.image.naturalWidth,h:entry.image.naturalHeight};
 let candidate=full,retained=100,confidence='未検出';
 try{
  const edge=window.A18SmartFrame.analyze(entry.image);
  if(edge&&edge.retained>=.55&&edge.retained<.99&&edge.edgeCount>=3){
   candidate=edge.rect;retained=Math.round(edge.retained*100);confidence=edge.confidence;
  }else{
   const original=window.A18PhotoPrep.cropSuggestion(entry.image);
   const ratio=(original.w*original.h)/(full.w*full.h);
   if(ratio>=.65&&ratio<.99){candidate=original;retained=Math.round(ratio*100);confidence='補助推定';}
  }
 }catch(err){console.warn('トリム候補が未検出のため元画像を維持',err)}
 // Cropping remains a suggestion. Uncertain boundaries default to OFF.
 const suggested=confidence==='medium'&&retained>=86&&retained<99;
 const tone=window.A18PhotoFinish.profile(entry.image);
 const cropIsUseful=candidate!==full;
 const attachment=
  '<div class="prep-pair"><div class="prep-preview"><strong>元の写真</strong><img id="previewBefore" alt="補正前" src="'+esc(entry.originalURL)+'"></div>'+
  '<div class="prep-preview"><strong>展示用の仕上がり</strong><img id="previewAfter" alt="自動補正後のプレビュー"></div></div>'+
  '<label class="prep-check"><input type="checkbox" id="autoCrop" '+(suggested?'checked':'')+' '+(!cropIsUseful?'disabled':'')+'>周囲の余白をトリム'+(!cropIsUseful?'（候補なし）':'')+'</label>'+
  '<label class="prep-check"><input type="checkbox" id="autoTone" checked>明るさ・色味・コントラストを調整</label>'+
  '<label class="prep-check"><input type="checkbox" id="autoDetail" checked>細部を自然にくっきり見せる</label>'+
  '<p class="prep-warn">トリムの目安：'+(cropIsUseful?'約'+retained+'%の面積を維持':'候補なし')+
  '。大切な部分が切れたり、色が不自然でないか見比べてください。反射・遠近の歪みを完全に除去するものではありません。</p>'+
  '<p id="prepError" class="error" role="status"></p>';
 ctx.open(activeRole==='butler'?'爺や｜自動仕上げの確認':'スタッフ｜自動仕上げの確認',
  reviewLayout(activeRole==='butler'?'こちらが仕上がりのご提案でございます。お好みの方をお選びください。':'仕上がりを見比べてみてね！ 好きな方を選んで大丈夫。',
   attachment,'<button id="acceptFinish">この仕上がりで展示</button><button id="acceptOriginal" class="light">元の写真で展示</button>'),'rpg');
 let result=null,previewVersion=0;
 const refresh=()=>{
  const version=++previewVersion;
  $('prepError').textContent='仕上がりを調整しています……';
  setTimeout(()=>{
   if(version!==previewVersion||!$('previewAfter'))return;
   try{
    const rect=$('autoCrop').checked?candidate:full,enhance=$('autoTone').checked;
    result=window.A18PhotoFinish.render(entry.image,rect,enhance,{tone,sharp:enhance&&$('autoDetail').checked,maxSize:1800});
    $('previewAfter').src=result.toDataURL('image/jpeg',.91);
    $('prepError').textContent='';
   }catch(err){result=null;$('prepError').textContent='補正できなかったため、元の写真で展示できます';console.error(err)}
  },15);
 };
 for(const id of ['autoCrop','autoTone','autoDetail'])$(id).onchange=refresh;
 $('acceptFinish').onclick=()=>{if(result)commit(ctx,entry,result);else $('prepError').textContent='処理が終わるまでお待ちください';};
 $('acceptOriginal').onclick=()=>commit(ctx,entry,null);
 refresh();
}
window.A18Registration={staffDialog,form,honorific,chatText};
})();
