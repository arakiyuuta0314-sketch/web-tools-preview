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
 '綺麗に飾れました！ ぜひ展示室でご覧ください。',
 '素晴らしい展示になりました。今回もお疲れさまです。',
 'またひとつ、この美術館に素敵な思い出が増えました。',
 '館長、仕上がりました。きっとお客様にも喜んでいただけます。',
 'お預かりした作品を大切に飾りました。ご確認ください。'
];
const last=new Map();
function pick(tag,arr){
 const previous=last.get(tag);let i=Math.floor(Math.random()*arr.length);
 if(i===previous&&arr.length>1)i=(i+1+Math.floor(Math.random()*(arr.length-1)))%arr.length;
 last.set(tag,i);return arr[i];
}
function staffDialog({open,close,list,sortDialog,form}){
 open('館スタッフ','<p class="staff-quote">'+esc(pick('hello',hellos))+'</p><p>作品の登録や展示替えも、私がお手伝いいたします。</p>'+
 '<div class="row"><button id="staffRegister">新しい作品を預ける</button><button id="all" class="light">作品一覧</button><button id="sort" class="light">自動並べ替え</button><button id="close" class="light">閉じる</button></div>');
 $('staffRegister').onclick=()=>form(0,true);$('all').onclick=list;$('sort').onclick=sortDialog;$('close').onclick=close;
}
function form({spotNo=0,viaStaff=false,open,close,slot,changeScene,works}){
 const ctx={spotNo,viaStaff,open,close,slot,changeScene,works};
 open(viaStaff?'館スタッフ｜作品のお預かり':'新しい作品を登録',
 '<p class="staff-quote">'+esc(viaStaff?pick('hello',hellos):'作品を選んでいただければ、綺麗に飾るお手伝いをいたします。')+'</p>'+
 '<label>展示場所<select id="spot"><option value="0">左の額縁</option><option value="1">中央の額縁</option><option value="2">右の額縁</option></select></label>'+
 '<label>作品名<input id="name" maxlength="80" placeholder="例：完成したパズル"></label>'+
 '<label>完成日<select id="mode"><option value="unknown">不明</option><option value="known">分かる</option></select></label>'+
 '<label id="dateWrap" hidden>完成日<input id="date" type="date"></label>'+
 '<label>ピース数（任意）<input id="pieces" type="number" min="1" max="999999"></label>'+
 '<label>写真<input id="photo" type="file" accept="image/*"></label>'+
 '<p class="prep-warn">元の写真はそのまま保管します。写真を外部に送信せず、この端末内で調整します（現在は試作版のため再読み込みで作品が消えます）。</p>'+
 '<p id="err" class="error"></p><div class="row"><button id="save">作品を預ける</button><button id="close" class="light">キャンセル</button></div>');
 $('spot').value=String(spotNo);$('mode').onchange=()=>$('dateWrap').hidden=$('mode').value==='unknown';
 $('close').onclick=close;
 $('save').onclick=()=>{
  const file=$('photo').files?.[0],name=$('name').value.trim();
  const index=Number($('spot').value),complete=$('mode').value==='known'?$('date').value:null;
  if(!name||!file){$('err').textContent='作品名と写真を選んでください';return}
  if(!file.type.startsWith('image/')){$('err').textContent='画像を選択してください';return}
  if(file.size>30*1024*1024){$('err').textContent='30MB以下の画像を選んでください';return}
  if($('mode').value==='known'&&!complete){$('err').textContent='完成日を入力してください';return}
  const originalURL=URL.createObjectURL(file),image=new Image();
  const entry={title:name,pieces:Number($('pieces').value)||null,complete,
   registered:new Date().toLocaleDateString('sv-SE'),spot:index,image,originalURL};
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
 const {open,close,slot,works,changeScene}=ctx;
 const existing=slot(entry.spot);
 if(existing){
  open('展示場所の確認','<p class="staff-quote">こちらには「'+esc(existing.title)+'」が展示中です。</p><p>新作と入れ替えると、試作版では以前の作品が登録一覧からも消えます。よろしいですか？</p>'+
   '<div class="prep-choices"><button id="overwrite">入れ替えて展示する</button><button id="cancelOverwrite" class="light">戻る</button></div>');
  $('overwrite').onclick=()=>finalize();
  $('cancelOverwrite').onclick=()=>compare(ctx,entry);
 }else finalize();
 function finalize(){
  const old=slot(entry.spot);
  if(old){const at=works.indexOf(old);if(at>=0)works.splice(at,1);if(old.originalURL&&old.originalURL.startsWith('blob:'))URL.revokeObjectURL(old.originalURL);}
  works.push({id:'local-'+Date.now(),title:entry.title,pieces:entry.pieces,complete:entry.complete,
   registered:entry.registered,photo:entry.image,originalURL:entry.originalURL,
   displayPhoto:canvas||entry.image,displaySrc:canvas?canvas.toDataURL('image/jpeg',.94):null,
   spot:entry.spot,source:null});
  open('館スタッフ｜展示のご案内','<p class="staff-quote">'+esc(pick('done',doneLines))+'</p>'+
   '<p>元の写真はそのまま残しています。鑑賞画面では展示用の仕上げと元写真を見比べられます。</p>'+
   '<div class="row"><button id="toExhibit">展示室で見る</button></div>');
  $('toExhibit').onclick=()=>{close();changeScene('gallery');};
 }
}
function compare(ctx,entry){
 const full={x:0,y:0,w:entry.image.naturalWidth,h:entry.image.naturalHeight};
 let candidate=full,retained=100;
 try{
  const c=window.A18PhotoPrep.cropSuggestion(entry.image);
  const ratio=(c.w*c.h)/(full.w*full.h);
  if(ratio>=.76&&ratio<.99){candidate=c;retained=Math.round(ratio*100);}
 }catch(err){console.warn('トリム候補が未検出のため元画像を維持',err)}
 const suggested=retained>=85&&retained<99;
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

