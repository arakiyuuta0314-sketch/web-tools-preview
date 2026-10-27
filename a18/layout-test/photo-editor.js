/* A18 original-first image editing; shared by registration and existing artworks. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const $=id=>document.getElementById(id);
const MAX_EDGE=4096,PREVIEW_EDGE=960;
const full=img=>({x:0,y:0,w:img.naturalWidth||img.width,h:img.naturalHeight||img.height});
const same=(a,b)=>a.x===b.x&&a.y===b.y&&a.w===b.w&&a.h===b.h;
function bounds(img,rect){
 if(!img?.naturalWidth||!img?.naturalHeight)throw Error('E_PHOTO_IMAGE');
 if(!rect||!['x','y','w','h'].every(k=>Number.isInteger(rect[k])))
  throw Error('E_PHOTO_CROP_TYPE');
 if(rect.w<2||rect.h<2||rect.x<0||rect.y<0||
  rect.x+rect.w>img.naturalWidth||rect.y+rect.h>img.naturalHeight)
  throw Error('E_PHOTO_CROP_BOUNDS');
 return {...rect};
}
function recommend(img){
 const base=full(img);let candidate=base,confidence='none',retained=1;
 try{
  const edge=window.A18SmartFrame.analyze(img);
  if(edge&&edge.retained>=.55&&edge.retained<.99&&edge.edgeCount>=3){
   candidate=bounds(img,edge.rect);confidence=edge.confidence;retained=edge.retained;
  }else{
   const suggestion=window.A18PhotoPrep.cropSuggestion(img);
   const good=bounds(img,suggestion),ratio=good.w*good.h/(base.w*base.h);
   if(ratio>=.65&&ratio<.99){candidate=good;confidence='auxiliary';retained=ratio;}
  }
 }catch(error){console.warn('A18 photo trim proposal unavailable; full source retained',error)}
 const enabled=confidence==='medium'&&retained>=.86&&retained<.99;
 return {candidate,enabled,retained,confidence};
}
function makeRecipe(img,{crop=null,cropEnabled=false,toneEnabled=true,sharpEnabled=true,toneProfile=null,perspectiveEnabled=false,quad=null}={}){
 const basis=full(img),box=bounds(img,crop||basis),tone=toneProfile||window.A18PhotoFinish.profile(img);
 if(!tone||!Array.isArray(tone.whiteBalance)||tone.whiteBalance.length!==3)throw Error('E_PHOTO_TONE');
 const corners=quad||window.A18PhotoPerspective.initial(img,cropEnabled?box:null);
 if(perspectiveEnabled)window.A18PhotoPerspective.validate(img.naturalWidth,img.naturalHeight,corners);
 return {version:1,sourceWidth:img.naturalWidth,sourceHeight:img.naturalHeight,
  crop:box,cropEnabled:Boolean(!perspectiveEnabled&&cropEnabled&&!same(box,basis)),
  perspectiveEnabled:Boolean(perspectiveEnabled),quad:corners.map(p=>({x:p.x,y:p.y})),
  toneEnabled:Boolean(toneEnabled),sharpEnabled:Boolean(sharpEnabled),
  toneProfile:{whiteBalance:[...tone.whiteBalance],gamma:tone.gamma,
   shadows:tone.shadows,highlights:tone.highlights,contrast:tone.contrast,
   saturation:tone.saturation,sharpness:tone.sharpness}};
}
function verify(img,r){
 if(!r||r.version!==1||r.sourceWidth!==img.naturalWidth||
  r.sourceHeight!==img.naturalHeight||typeof r.cropEnabled!=='boolean'||
  typeof r.toneEnabled!=='boolean'||typeof r.sharpEnabled!=='boolean')
  throw Error('E_PHOTO_RECIPE');
 bounds(img,r.crop);
 if(r.perspectiveEnabled!==undefined&&typeof r.perspectiveEnabled!=='boolean')
  throw Error('E_PHOTO_PERSPECTIVE_FLAG');
 if(r.quad!==undefined)
  window.A18PhotoPerspective.validate(img.naturalWidth,img.naturalHeight,r.quad);
 if(r.perspectiveEnabled){
  if(r.quad===undefined||r.cropEnabled)throw Error('E_PHOTO_PERSPECTIVE_RECIPE');
  window.A18PhotoPerspective.validate(img.naturalWidth,img.naturalHeight,r.quad);
 }
 const profile=r.toneProfile;
 if(!profile||!Array.isArray(profile.whiteBalance)||profile.whiteBalance.length!==3||
  ![...profile.whiteBalance,profile.gamma,profile.shadows,profile.highlights,
    profile.contrast,profile.saturation,profile.sharpness].every(Number.isFinite))
  throw Error('E_PHOTO_RECIPE_TONE');
 return r;
}
function render(img,r,maxEdge=MAX_EDGE){
 verify(img,r);
 if(!Number.isInteger(maxEdge)||maxEdge<1||maxEdge>MAX_EDGE)throw Error('E_PHOTO_EDGE_LIMIT');
 const corrected=r.perspectiveEnabled?window.A18PhotoPerspective.render(img,r.quad,maxEdge):img;
 const rect=r.perspectiveEnabled?full(corrected):(r.cropEnabled?r.crop:full(img));
 const adjust=r.toneEnabled||r.sharpEnabled;
 return window.A18PhotoFinish.render(corrected,rect,adjust,{
  tone:r.toneEnabled?r.toneProfile:{whiteBalance:[1,1,1],gamma:1,
   shadows:0,highlights:0,contrast:1,saturation:1,sharpness:0},
  sharp:r.sharpEnabled,maxSize:maxEdge,clarity:.27
 });
}
function thumbnail(canvas){
 const result=document.createElement('canvas');result.width=176;result.height=132;
 const cx=result.getContext('2d');cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';
 cx.fillStyle='#e7dcc8';cx.fillRect(0,0,176,132);
 const s=Math.min(176/canvas.width,132/canvas.height);
 cx.drawImage(canvas,(176-canvas.width*s)/2,(132-canvas.height*s)/2,canvas.width*s,canvas.height*s);
 return result.toDataURL('image/jpeg',.92);
}
async function load(originalURL){
 const img=new Image();img.src=originalURL;
 await img.decode();
 if(!img.naturalWidth||!img.naturalHeight)throw Error('E_PHOTO_DECODE');
 return img;
}
function ui({originalURL,img,recipe=null,renderDialog,onFinish,onOriginal,onCancel,labels={}}){
 if(!originalURL||!img?.naturalWidth||typeof renderDialog!=='function'||
  typeof onFinish!=='function'||typeof onOriginal!=='function')throw Error('E_PHOTO_EDITOR_ARGS');
 const guess=recommend(img),initial=recipe?verify(img,recipe):
  makeRecipe(img,{crop:guess.candidate,cropEnabled:guess.enabled});
 const hasProposal=!same(guess.candidate,full(img));
 const legacyNoRecipe=recipe===null;
 const content=
  '<div id="editorPreviewPair" class="prep-pair"><div class="prep-preview"><strong>原本</strong><img id="previewBefore" alt="元の写真" src="'+esc(originalURL)+'"></div>'+
  '<div class="prep-preview"><strong>仕上がり</strong><img id="previewAfter" alt="仕上げ後の写真"></div></div>'+
  '<button type="button" id="editorPreviewZoom" class="light" style="width:100%;min-height:42px">写真を大きく見比べる</button>'+
  '<label class="prep-check"><input type="checkbox" id="autoCrop"'+(initial.cropEnabled?' checked':'')+
   (!hasProposal&&!initial.cropEnabled?' disabled':'')+'>周囲の余白をトリム'+
   (!hasProposal&&!initial.cropEnabled?'（候補なし）':'')+'</label>'+
  '<label class="prep-check"><input type="checkbox" id="autoPerspective"'+(initial.perspectiveEnabled?' checked':'')+
    '>撮影角度を補正（写真の四隅を調整）</label>'+
  '<div id="perspectiveEditor" hidden style="margin:12px 0;padding:10px;border:1px solid #ac956b;border-radius:12px">'+
   '<strong>残したい絵柄の四隅に丸印を合わせてください</strong>'+
   '<p class="small">角を指で動かして、斜めに撮ったパズルを正面向きに補正します。枠の外の白い余白も取り除けます。</p>'+
   '<div id="perspectiveStage" style="position:relative;width:100%;touch-action:pan-y">'+
   '<img id="perspectiveSource" src="'+esc(originalURL)+'" alt="四隅を指定する元写真" style="display:block;width:100%;height:auto">'+
   '<svg id="perspectiveGuide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">'+
   '<polygon id="perspectivePolygon" points="" stroke="#ffda55" stroke-width=".55" fill="rgba(255,218,85,.12)" vector-effect="non-scaling-stroke"></polygon></svg>'+
   [0,1,2,3].map((i)=>'<button type="button" class="perspectiveHandle" data-point="'+i+'" aria-label="'+
    ['左上','右上','右下','左下'][i]+'の角" style="position:absolute;width:38px;height:38px;min-width:38px;min-height:38px;border-radius:50%;border:2px solid #fff;background:#315d4c;color:#fff;touch-action:none;transform:translate(-50%,-50%);z-index:2;font-weight:bold">'+(i+1)+'</button>').join('')+
   '</div><button type="button" id="resetPerspective" class="light" style="margin-top:8px">四隅を初期位置に戻す</button>'+
   '<p class="small">写真の中央に写った光の反射そのものは角度補正では消えません。</p></div>'+
  '<label class="prep-check"><input type="checkbox" id="autoTone"'+(initial.toneEnabled?' checked':'')+'>明るさ・色味・コントラストを整える</label>'+
  '<label class="prep-check"><input type="checkbox" id="autoDetail"'+(initial.sharpEnabled?' checked':'')+'>輪郭・細部を自然にくっきり</label>'+
  '<p class="prep-warn">'+(legacyNoRecipe?'原本から仕上げます。':'前回の設定を引き継ぎました。')+
  ' 周囲のトリムは任意です。プレビューと元写真を見比べ、大切な部分が切れていないか確認してください。'+
  ' 保存時は原本から高解像度で作成し、原本は消しません。</p>'+
  '<p id="prepError" class="error" role="status"></p>';
 const actions='<button id="acceptFinish">'+esc(labels.save||'この仕上がりで展示')+'</button>'+
  '<button id="acceptOriginal" class="light">'+esc(labels.original||'元の写真で展示')+'</button>'+
  (onCancel?'<button id="editorCancel" class="light">戻る</button>':'');
 renderDialog(content,actions);
 const fields=()=>[ 'autoCrop','autoPerspective','autoTone','autoDetail' ].map($);
 const sourceWidth=img.naturalWidth,sourceHeight=img.naturalHeight;
 let corners=(initial.quad||window.A18PhotoPerspective.initial(img,initial.cropEnabled?initial.crop:null))
  .map(p=>({x:p.x,y:p.y}));
 let restoreCrop=$('autoCrop').checked;
 const redrawCorners=()=>{
  const handles=[...document.querySelectorAll('.perspectiveHandle')];
  if(handles.length!==4)throw Error('E_PERSPECTIVE_HANDLES');
  for(let n=0;n<4;n++){
   handles[n].style.left=(corners[n].x/sourceWidth*100)+'%';
   handles[n].style.top=(corners[n].y/sourceHeight*100)+'%';
  }
  $('perspectivePolygon').setAttribute('points',
   corners.map(p=>(p.x/sourceWidth*100)+','+(p.y/sourceHeight*100)).join(' '));
 };
 const togglePerspective=()=>{
  const enabled=$('autoPerspective').checked;
  $('perspectiveEditor').hidden=!enabled;
  if(enabled){
   restoreCrop=$('autoCrop').checked;
   $('autoCrop').checked=false;$('autoCrop').disabled=true;
  }else{
   $('autoCrop').disabled=!hasProposal&&!initial.cropEnabled;
   $('autoCrop').checked=restoreCrop;
  }
  redrawCorners();
 };
 togglePerspective();
 const dragged=[...document.querySelectorAll('.perspectiveHandle')];
 for(const handle of dragged){
  const index=Number(handle.dataset.point);
  handle.onpointerdown=e=>{
   e.preventDefault();handle.setPointerCapture(e.pointerId);
  };
  handle.onpointermove=e=>{
   if(!handle.hasPointerCapture(e.pointerId))return;
   const b=$('perspectiveStage').getBoundingClientRect();
   const x=Math.max(.01,Math.min(.99,(e.clientX-b.left)/b.width));
   const y=Math.max(.01,Math.min(.99,(e.clientY-b.top)/b.height));
   corners[index]={x:x*(sourceWidth-1),y:y*(sourceHeight-1)};
   redrawCorners();
  };
  handle.onpointerup=e=>{
   if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
   preview();
  };
  handle.onpointercancel=e=>{
   if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
   preview();
  };
  handle.onkeydown=e=>{
   const steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
   if(!steps[e.key])return;
   e.preventDefault();
   const delta=e.shiftKey?.02:.005;
   corners[index]={x:Math.max(0,Math.min(sourceWidth-1,corners[index].x+steps[e.key][0]*sourceWidth*delta)),
    y:Math.max(0,Math.min(sourceHeight-1,corners[index].y+steps[e.key][1]*sourceHeight*delta))};
   redrawCorners();preview();
  };
 }
 $('resetPerspective').onclick=()=>{
  corners=window.A18PhotoPerspective.initial(img).map(p=>({x:p.x,y:p.y}));
  redrawCorners();preview();
 };
 $('autoPerspective').onchange=()=>{togglePerspective();preview();};
 $('autoCrop').onchange=()=>{restoreCrop=$('autoCrop').checked;preview();};
 let enlarged=false;
 $('editorPreviewZoom').onclick=()=>{
  enlarged=!enlarged;
  const pair=$('editorPreviewPair');
  pair.style.gridTemplateColumns=enlarged?'1fr':'';
  for(const img of [ $('previewBefore'),$('previewAfter') ])
   img.style.height=enlarged?'min(40dvh,360px)':'';
  $('editorPreviewZoom').textContent=enlarged?'並べて比較する':'写真を大きく見比べる';
 };
 if(fields().some(v=>!v)||!$('prepError')||!$('previewAfter'))throw Error('E_PHOTO_EDITOR_DOM');
 if(!recipe){
  $('autoCrop').disabled=!hasProposal;
 }else if(initial.cropEnabled){
  $('autoCrop').disabled=false;
 }
 let busy=false,ticket=0,current=initial,previewReady=false;
 const preview=()=>{
  const id=++ticket;
  $('prepError').textContent='仕上がりを確認しています…';
  $('acceptFinish').disabled=true;previewReady=false;
  setTimeout(()=>{
   if(id!==ticket||!$('previewAfter'))return;
   try{
    current=makeRecipe(img,{crop:recipe?.cropEnabled?recipe.crop:guess.candidate,
     cropEnabled:$('autoCrop').checked,perspectiveEnabled:$('autoPerspective').checked,
     quad:corners,toneEnabled:$('autoTone').checked,
     sharpEnabled:$('autoDetail').checked,toneProfile:initial.toneProfile});
    const sample=render(img,current,PREVIEW_EDGE);
    $('previewAfter').src=sample.toDataURL('image/jpeg',.95);
    $('prepError').textContent='プレビューです。保存時は原本から高精細に作り直します。';
    previewReady=true;$('acceptFinish').disabled=false;
   }catch(e){console.error('A18 photo preview',e);$('prepError').textContent='プレビューに失敗：'+e.message;}
  },30);
 };
 for(const f of ['autoTone','autoDetail'])$(f).onchange=preview;
 const run=async(mode)=>{
  if(busy)return;
  if(mode==='finish'&&!previewReady){$('prepError').textContent='プレビューが完了していません';return;}
  busy=true;for(const btn of ['acceptFinish','acceptOriginal','editorCancel'])if($(btn))$(btn).disabled=true;
  $('prepError').textContent=mode==='finish'?'原本から高解像度で仕上げています…':'原本を使用します…';
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  try{
   const accepted=mode==='finish'
    ?await onFinish({recipe:current,canvas:render(img,current,MAX_EDGE)})
    :await onOriginal();
   if(!accepted)throw Error('E_PHOTO_SAVE_NOT_COMMITTED');
  }catch(e){
   console.error('A18 photo editor save error',e);
   if($('prepError'))$('prepError').textContent='保存できませんでした：'+e.message;
   busy=false;for(const btn of ['acceptFinish','acceptOriginal','editorCancel'])if($(btn))$(btn).disabled=false;
  }
 };
 $('acceptFinish').onclick=()=>{void run('finish')};
 $('acceptOriginal').onclick=()=>{void run('original')};
 if(onCancel)$('editorCancel').onclick=onCancel;
 preview();
}
window.A18PhotoEditor={MAX_EDGE,makeRecipe,verify,render,load,ui,thumbnail};
})();
