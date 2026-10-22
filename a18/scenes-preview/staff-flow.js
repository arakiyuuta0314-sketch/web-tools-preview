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
function staffPortrait(message,person='館スタッフ'){
 return '<div class="rpg-chat"><div class="rpg-portrait"><img src="assets/staff-front.png" alt="スタッフ"></div>'+
 '<div class="rpg-words"><span class="rpg-name">'+esc(person)+'</span>'+
 '<p class="rpg-message">'+esc(message)+'</p></div></div>';
}
function reviewLayout(message,media,choices){
 return '<div class="rpg-review">'+
 '<section class="rpg-attachment" aria-label="写真と展示前の確認">'+media+'</section>'+
 '<section class="rpg-review-dialogue">'+staffPortrait(message)+
 '<div class="rpg-choices">'+choices+'</div></section></div>';
}
function staffDialog({open,close,list,sortDialog,form,scene,carrying}){
 const gallery=scene==='gallery';
 const title=gallery?'展示室スタッフ':'エントランススタッフ';
 const nextText='さて、館長。今日はどのようなご用件でしょうか？';
 function speaker(message,more=''){
  return '<div class="rpg-chat">'+
   '<div class="rpg-portrait"><img src="assets/staff-front.png" alt="スタッフ"></div>'+
   '<div class="rpg-words"><span class="rpg-name">'+esc(title)+'</span>'+
   '<p class="rpg-message">'+esc(message)+'</p></div></div>'+more;
 }
 function menu(){
  open(title,speaker(nextText,
   '<div class="rpg-choices">'+
   '<button id="staffRegister">新しい作品を預ける</button>'+
   '<button id="all">作品の一覧を見る</button>'+
   '<button id="sort">展示順を並べ替える</button>'+
   '<button id="close" class="light">またあとで</button></div>'),'rpg');
  $('staffRegister').onclick=()=>{
   if(carrying){
    open(title,speaker('館長、いま作品をお持ちですね。飾るか保管してから、またお預かりいたします。',
     '<div class="rpg-choices"><button id="returnMenu">わかりました</button><button id="close" class="light">戻る</button></div>'),'rpg');
    $('returnMenu').onclick=menu;$('close').onclick=close;return;
   }
   form(0,true);
  };
  $('all').onclick=list;$('sort').onclick=sortDialog;$('close').onclick=close;
 }
 open(title,'<button type="button" id="rpgAdvance" class="rpg-dialogue-advance" aria-label="次の会話へ進む">'+
   speaker(pick('hello',hellos))+
   '<span class="rpg-tap-next">▼ タップでつづく</span></button>','rpg');
 $('rpgAdvance').onclick=menu;
}
function form({spotNo=0,viaStaff=false,open,close,works,onRegistered,changeScene,maxWorks=50}){
 const ctx={spotNo,viaStaff,open,close,works,onRegistered,changeScene};
 if(works.length>=maxWorks){open('作品の登録上限','<p>'+maxWorks+'作品に達しました。別フロアへの増築は今後のアップデートで検討します。</p><div class="row"><button id="close">閉じる</button></div>');$('close').onclick=close;return;}
 open('スタッフ｜作品のお預かり',
 staffPortrait(pick('hello',hellos))+
 '<div class="registration-fields">'+
 '<label>作品名<input id="name" maxlength="80" placeholder="例：お気に入りの風景"></label>'+
 '<label>完成日（任意：不明なら今日を選択）<input id="date" type="date"></label>'+
 '<div class="date-actions"><button type="button" id="dateClear" class="light">不明として記録</button><button type="button" id="dateToday" class="light">今日に戻す</button></div>'+
 '<label>ピース数（任意）<input id="pieces" type="number" min="1" max="999999"></label>'+
 '<label>備考・思い出（任意）<textarea id="notes" maxlength="3000" rows="4" placeholder="作品にまつわる出来事や思い出を自由に残せます"></textarea></label>'+
 '<label>写真<input id="photo" type="file" accept="image/*"></label></div>'+
 '<p class="prep-warn">元の写真はそのまま端末内で保持します。現在は試作版のため、再読み込みで作品が消えます。</p>'+
 '<p id="err" class="error"></p><div class="row"><button id="save">作品を預ける</button><button id="close" class="light">キャンセル</button></div>');
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
   notes:$('notes').value.trim(),registered:today(),spot:null,image,originalURL};
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
 open('館スタッフ｜展示前のご相談',
  reviewLayout(pick('praise',compliments)+' 私の方で、余白や明るさ、色味を整えてもよろしいですか？',
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
 works.push({id,title:entry.title,pieces:entry.pieces,complete:entry.complete,notes:entry.notes,
  registered:entry.registered,originalURL:entry.originalURL,
  displaySrc:canvas?canvas.toDataURL('image/jpeg',.94):entry.originalURL,
  thumbnail,spot:null,source:null});
 open('スタッフ｜作品のお渡し',
  '<div class="rpg-chat"><div class="rpg-portrait"><img src="assets/staff-front.png" alt="スタッフ"></div><div class="rpg-words"><span class="rpg-name">館スタッフ</span><p class="rpg-message">'+esc(pick('done',[
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
 ctx.open('館スタッフ｜自動仕上げの確認',
  reviewLayout('こちらが仕上がりのご提案です。元のお写真と比べて、お好きな方をお選びください。',
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
window.A18Registration={staffDialog,form};
})();

