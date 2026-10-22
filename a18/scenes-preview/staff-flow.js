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
function staffDialog({open,close,list,sortDialog,form,scene,carrying}){
 const gallery=scene==='gallery';
 open(gallery?'展示室スタッフ':'入口スタッフ',
 '<p class="staff-quote">'+esc(pick('hello',hellos))+'</p>'+
 (gallery?'<p>新作をお預かりしたら、館長にお渡しします。お好きな額縁まで運んでくださいね。</p>':
 '<p>入口では作品一覧や展示順を管理しています。登録は展示室のスタッフにご相談ください。</p>')+
 '<div class="row">'+(gallery?'<button id="staffRegister">新しい作品を預ける</button>':'')+
 '<button id="all" class="light">作品一覧</button><button id="sort" class="light">自動並べ替え</button><button id="close" class="light">閉じる</button></div>');
 if(gallery)$('staffRegister').onclick=()=>{
  if(carrying){open('作品の受け取り','<p>いま作品を持っています。先に額縁へ飾るか、作品一覧へしまってください。</p><div class="row"><button id="close">戻る</button></div>');$('close').onclick=close;return;}
  form(0,true);
 };
 $('all').onclick=list;$('sort').onclick=sortDialog;$('close').onclick=close;
}
function form({spotNo=0,viaStaff=false,open,close,works,onRegistered,changeScene,maxWorks=50}){
 const ctx={spotNo,viaStaff,open,close,works,onRegistered,changeScene};
 if(works.length>=maxWorks){open('作品の登録上限','<p>50作品に達しました。今後の増築アップデートで上限を拡張する予定です。</p><div class="row"><button id="close">閉じる</button></div>');$('close').onclick=close;return;}
 open('展示室スタッフ｜作品のお預かり',
 '<p class="staff-quote">'+esc(pick('hello',hellos))+'</p>'+
 '<label>作品名<input id="name" maxlength="80" placeholder="例：完成したパズル"></label>'+
 '<label>完成日（任意）<input id="date" type="date" value=""></label>'+
 '<div class="date-actions"><button type="button" id="dateToday" class="light">今日を設定</button><button type="button" id="dateClear" class="light">クリア（不明）</button></div>'+
 '<label>ピース数（任意）<input id="pieces" type="number" min="1" max="999999"></label>'+
 '<label>写真<input id="photo" type="file" accept="image/*"></label>'+
 '<p class="prep-warn">元の写真はそのまま端末内で保持します。現在は試作版のため、再読み込みで作品が消えます。</p>'+
 '<p id="err" class="error"></p><div class="row"><button id="save">作品を預ける</button><button id="close" class="light">キャンセル</button></div>');
 $('dateToday').onclick=()=>{$('date').value=new Date().toLocaleDateString('sv-SE');};
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
   registered:new Date().toLocaleDateString('sv-SE'),spot:null,image,originalURL};
  image.onload=()=>offer(ctx,entry);
  image.onerror=()=>{URL.revokeObjectURL(originalURL);$('err').textContent='写真を読み込めませんでした'};
  image.src=originalURL;
 };
}
function offer(ctx,entry){
 const {open,close}=ctx;
 open('館スタッフ｜展示前のご相談',
 '<p class="staff-quote">'+esc(pick('praise',compliments))+'<br>私の方で、周囲の余白を整え、明るさ・色味・コントラスト・細部の見え方を調整してもよろしいですか？</p>'+
 '<p>写真を綺麗に飾るための<strong>自動仕上げ</strong>をご提案します。仕上がりを確認してから決められます。原本には一切手を加えません。</p>'+
 '<div class="prep-pair"><div class="prep-preview" style="grid-column:1/-1"><strong>お預かりした写真</strong><img id="offerOriginal" alt="元の写真" src="'+esc(entry.originalURL)+'"></div></div>'+
 '<div class="prep-choices"><button id="offerYes">はい、仕上がりを見たい</button><button id="offerNo" class="light">元のまま展示する</button></div>'+
 '<p class="prep-warn">光の反射や遠近の歪みを完全に消す処理ではありません。誤った切り抜きや強い補正は避けられるよう、必ず選択できます。</p>');
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
 works.push({id,title:entry.title,pieces:entry.pieces,complete:entry.complete,
  registered:entry.registered,originalURL:entry.originalURL,
  displaySrc:canvas?canvas.toDataURL('image/jpeg',.94):entry.originalURL,
  thumbnail,spot:null,source:null});
 open('展示室スタッフ｜作品のお渡し',
  '<p class="staff-quote">'+esc(pick('done',[
    '丁寧に仕上げました。どうぞ、館長。お好きな場所へ飾ってください！',
    '今回の新作、お預かりしました。額縁までは館長にお願いしてもよろしいですか？',
    '美しく仕上がりました。ぜひ館長ご自身の手で飾ってください。',
    ...doneLines.map(t=>t+' 作品をお渡ししますね。')
  ]))+'</p>'+
  '<p>作品を受け取ったら好きな額縁まで運んでください。展示中の作品がある場合はその場で入れ替わり、前の作品を館長が持ちます。</p>'+
  '<div class="row"><button id="receiveWork">作品を受け取る</button></div>');
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
 ctx.open('館スタッフ｜自動仕上げの確認',
  '<p class="staff-quote">こちらが仕上がりのご提案です。実際の作品と見比べて、お好みの方をお選びください。</p>'+
  '<div class="prep-pair"><div class="prep-preview"><strong>元の写真</strong><img id="previewBefore" alt="補正前" src="'+esc(entry.originalURL)+'"></div>'+
  '<div class="prep-preview"><strong>展示用の仕上がり</strong><img id="previewAfter" alt="自動補正後のプレビュー"></div></div>'+
  '<label class="prep-check"><input type="checkbox" id="autoCrop" '+(suggested?'checked':'')+' '+(!cropIsUseful?'disabled':'')+'>周囲の余白をトリム'+(!cropIsUseful?'（候補なし）':'')+'</label>'+
  '<label class="prep-check"><input type="checkbox" id="autoTone" checked>明るさ・色味・コントラストを調整</label>'+
  '<label class="prep-check"><input type="checkbox" id="autoDetail" checked>細部を自然にくっきり見せる</label>'+
  '<p class="prep-warn">トリム候補は画像の縁から自動推定します。'+(cropIsUseful?'候補を使う場合は約'+retained+'%の面積を残します。':'')+
  ' 意図しない切り取りや色の変化がないか、必ず左右を見比べてください。光の反射や遠近のゆがみを完全に除去する機能ではありません。</p>'+
  '<p id="prepError" class="error"></p>'+
  '<div class="prep-choices"><button id="acceptFinish">この仕上がりで展示</button>'+
  '<button id="acceptOriginal" class="light">元の写真で展示</button></div>');
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

