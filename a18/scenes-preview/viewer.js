/* Full-resolution viewer for real, detailed jigsaw photographs.
   Photos stay in the browser as local Blob URLs and are never sent to a server. */
(() => {
  'use strict';
  const root = document.getElementById('photoViewer');
  const $ = id => document.getElementById(id);
  const stage = $('photoViewport'), photo = $('photoImage'), frame=$('photoFrame');
  const title = $('photoTitle'), counter = $('photoCounter'), details = $('photoDetails');
  const zoomText = $('photoZoomText'), empty = $('photoEmpty');
  let items=[],index=0,onClose=()=>{},scale=1,dx=0,dy=0,showOriginal=false,focus=false;
  const active=new Map();
  let gesture=null,gestureStart=null,lastTap=0,lastTapAt=null,isOpen=false,usedMulti=false;
  const MAX_ZOOM=10,MIN_ZOOM=1;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const current=()=>items[index];
  const area=()=>stage.getBoundingClientRect();
  function render(){
    if(!isOpen)return;
    const bounds=area();
    const iw=photo.naturalWidth||1,ih=photo.naturalHeight||1;
    // The entire image is visible at 100%, surrounded by a real gold frame.
    const fit=Math.min(Math.max(1,bounds.width)/iw,Math.max(1,bounds.height)/ih);
    const frameW=iw*fit,frameH=ih*fit;
    frame.style.width=frameW+'px';frame.style.height=frameH+'px';
    const maxX=Math.max(0,(frameW*scale-bounds.width)/2);
    const maxY=Math.max(0,(frameH*scale-bounds.height)/2);
    dx=clamp(dx,-maxX,maxX);dy=clamp(dy,-maxY,maxY);
    frame.style.transform='translate3d('+dx+'px,'+dy+'px,0) scale('+scale+')';
    zoomText.textContent=Math.round(scale*100)+'%';
    $('photoMinus').disabled=scale<=1.001;
    $('photoPlus').disabled=scale>=MAX_ZOOM-.001;
    $('photoReset').disabled=scale<=1.001;
  }
  function zoomTo(next,point){
    if(!isOpen)return;
    const bounded=clamp(next,MIN_ZOOM,MAX_ZOOM),ratio=bounded/scale;
    const b=area();
    const px=point ? point.x-b.left-b.width/2:0;
    const py=point ? point.y-b.top-b.height/2:0;
    dx=px-(px-dx)*ratio;dy=py-(py-dy)*ratio;
    scale=bounded;render();
  }
  function reset(){scale=1;dx=0;dy=0;active.clear();gesture=null;render();}
  function updateItem(){
    const entry=current();if(!entry)return;
    showOriginal=false;reset();
    title.textContent=entry.title||'無題の作品';
    counter.textContent=(index+1)+' / '+items.length+' 作品';
    const date=entry.complete||'不明',pieces=entry.pieces ? entry.pieces.toLocaleString('ja-JP')+'ピース':'ピース数未登録';
    const registered=entry.registered||'不明';
    const note=(entry.notes||'').trim();
    details.classList.toggle('has-memory',!!note);
    details.textContent=pieces+'　｜　完成日 '+date+'　｜　登録日 '+registered+(note?'\n備考・思い出：'+note:'');
    $('photoPrev').disabled=index<=0;$('photoNext').disabled=index>=items.length-1;
    photo.hidden=!entry.src;frame.hidden=!entry.src;empty.hidden=!!entry.src;
    photo.alt=(entry.title||'作品')+'の全体写真';
    $('photoCompare').hidden=!entry.originalSrc||entry.originalSrc===entry.src;
    $('photoCompare').textContent='元写真';
    photo.onload=()=>{
      const portraitPhoto=photo.naturalHeight>photo.naturalWidth;
      root.dataset.artOrientation=portraitPhoto?'portrait':'landscape';
      const screenPortrait=window.innerHeight>=window.innerWidth;
      const mismatch=portraitPhoto!==screenPortrait;
      $('photoOrientationNotice').textContent=mismatch?(portraitPhoto
       ?'縦長作品：端末を縦向きにすると大きく見られます'
       :'横長作品：端末を横向きにすると大きく見られます'):'';
      root.classList.toggle('needs-turn',mismatch);
      reset();
    };
    photo.onerror=()=>{photo.hidden=true;frame.hidden=true;empty.hidden=false;empty.textContent='画像を読み込めませんでした'};
    if(entry.src){empty.hidden=true;photo.src=entry.src;}
    else{photo.removeAttribute('src');empty.textContent='作品写真はまだ登録されていません';}
  }
  function open(options){
    if(!options||!Array.isArray(options.items)||!options.items.length)return;
    items=options.items.filter(x=>x&&x.id&&typeof x.src==='string');
    if(!items.length)return;
    const found=items.findIndex(x=>x.id===options.selectedId);
    index=found>=0?found:0;
    onClose=typeof options.onClose==='function'?options.onClose:()=>{};
    isOpen=true;focus=false;root.classList.remove('is-focus');$('photoFocus').textContent='集中';root.hidden=false;document.body.classList.add('a18-photo-open');
    updateItem();$('photoClose').focus({preventScroll:true});
  }
  function close(){
    if(!isOpen)return;
    isOpen=false;root.hidden=true;document.body.classList.remove('a18-photo-open');
    active.clear();gesture=null;photo.onload=null;photo.onerror=null;
    photo.removeAttribute('src');frame.style.transform='';
    const selectedId=current()?.id;const done=onClose;onClose=()=>{};done(selectedId);
  }
  function navigate(step){
    if(!isOpen)return;
    const next=index+step;
    if(next>=0&&next<items.length){index=next;updateItem();}
  }
  function centerOf(points){
    const ar=Array.from(points.values());
    return {x:(ar[0].x+ar[1].x)/2,y:(ar[0].y+ar[1].y)/2,
      distance:Math.hypot(ar[0].x-ar[1].x,ar[0].y-ar[1].y)};
  }
  stage.addEventListener('pointerdown',e=>{
    if(!isOpen||e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();stage.setPointerCapture?.(e.pointerId);
    active.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(active.size===1)gestureStart={x:e.clientX,y:e.clientY};
    if(active.size===2){usedMulti=true;lastTap=0;gesture={...centerOf(active),scale,dx,dy};}
    else if(active.size===1)gesture={x:e.clientX,y:e.clientY,dx,dy};
  });
  stage.addEventListener('pointermove',e=>{
    if(!isOpen||!active.has(e.pointerId))return;
    e.preventDefault();active.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(active.size>=2){
      const now=centerOf(active);
      if(!gesture||typeof gesture.distance!=='number')gesture={...now,scale,dx,dy};
      // The midpoint and focal image point both stay under the user's fingers.
      const next=clamp(gesture.scale*now.distance/Math.max(1,gesture.distance),MIN_ZOOM,MAX_ZOOM);
      const old=scale;scale=gesture.scale;dx=gesture.dx;dy=gesture.dy;
      const b=area(),focus={x:gesture.x,y:gesture.y};
      const ratio=next/scale;
      const px=focus.x-b.left-b.width/2,py=focus.y-b.top-b.height/2;
      dx=px-(px-dx)*ratio+(now.x-gesture.x);
      dy=py-(py-dy)*ratio+(now.y-gesture.y);
      scale=next;render();
    }else if(active.size===1&&gesture){
      if(scale>1){dx=gesture.dx+e.clientX-gesture.x;dy=gesture.dy+e.clientY-gesture.y;render();}
    }
  });
  const finish=e=>{
    if(!active.has(e.pointerId))return;
    const prev=active.get(e.pointerId);active.delete(e.pointerId);
    if(active.size===1){const pt=Array.from(active.values())[0];gesture={x:pt.x,y:pt.y,dx,dy};}
    else{gesture=null;}
    // Single tap returns to the artwork inspection panel.
    if(active.size===0&&!usedMulti&&e.type==='pointerup'&&scale<=1.01&&gestureStart){
      const mx=e.clientX-gestureStart.x,my=e.clientY-gestureStart.y;
      if(Math.abs(mx)>55&&Math.abs(mx)>Math.abs(my)*1.35)navigate(mx<0?1:-1);
      else if(Math.hypot(mx,my)<18)close();
    }
    if(active.size===0){usedMulti=false;gestureStart=null;}
  };
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(ev,finish);
  stage.addEventListener('dblclick',e=>{e.preventDefault();});
  stage.addEventListener('wheel',e=>{if(!isOpen)return;e.preventDefault();zoomTo(scale*(e.deltaY<0?1.22:1/1.22),{x:e.clientX,y:e.clientY});},{passive:false});
  stage.addEventListener('contextmenu',e=>e.preventDefault());
  stage.addEventListener('touchstart',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
  $('photoClose').onclick=close;
  $('photoPrev').onclick=()=>navigate(-1);
  $('photoNext').onclick=()=>navigate(1);
  $('photoMinus').onclick=()=>zoomTo(scale/1.6);
  $('photoPlus').onclick=()=>zoomTo(scale*1.6);
  $('photoReset').onclick=reset;
  $('photoFocus').onclick=()=>{focus=!focus;root.classList.toggle('is-focus',focus);$('photoFocus').textContent=focus?'戻す':'集中';reset()};
  $('photoCompare').onclick=()=>{
    const entry=current();if(!entry?.originalSrc)return;
    showOriginal=!showOriginal;
    $('photoCompare').textContent=showOriginal?'展示版':'元写真';
    reset();photo.src=showOriginal?entry.originalSrc:entry.src;
  };
  window.addEventListener('keydown',e=>{
    if(!isOpen)return;
    if(['Escape','ArrowLeft','ArrowRight','+','-','0'].includes(e.key))e.preventDefault();
    if(e.key==='Escape')close();
    else if(e.key==='ArrowLeft')navigate(-1);
    else if(e.key==='ArrowRight')navigate(1);
    else if(e.key==='+'||e.key==='=')zoomTo(scale*1.6);
    else if(e.key==='-')zoomTo(scale/1.6);
    else if(e.key==='0')reset();
  },true);
  window.addEventListener('resize',()=>{if(isOpen){const portraitPhoto=photo.naturalHeight>photo.naturalWidth;const screenPortrait=innerHeight>=innerWidth;const mismatch=portraitPhoto!==screenPortrait;root.classList.toggle('needs-turn',mismatch);$('photoOrientationNotice').textContent=mismatch?(portraitPhoto?'縦長作品：端末を縦向きにすると大きく見られます':'横長作品：端末を横向きにすると大きく見られます'):'';render();}});
  // Explicitly exposed solely for browser tests; do not include original photo bytes.
  window.A18Viewer={open,close,zoomTo,reset,navigate,state:()=>({open:isOpen,index,count:items.length,scale,dx,dy,showOriginal,focus,title:current()?.title||''})};
})();
