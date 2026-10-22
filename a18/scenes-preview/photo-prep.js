/* A18 museum photo preparation: entirely local and non-destructive.
   Crop detection is heuristic, not subject or document detection.
   Original image remains available at full resolution. */
(() => {
 'use strict';
 function smooth(a,radius=3){return a.map((_,i)=>{let s=0,n=0;for(let k=Math.max(0,i-radius);k<=Math.min(a.length-1,i+radius);k++){s+=a[k];n++;}return s/n;});}
 function average(a){return a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);}
 function cropSuggestion(image){
  const w=384,h=Math.max(120,Math.round(384*image.naturalHeight/image.naturalWidth)),c=document.createElement('canvas');
  c.width=w;c.height=h;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,w,h);
  const px=ctx.getImageData(0,0,w,h).data;
  const rows=new Array(h).fill(0),cols=new Array(w).fill(0);
  // Find texture transitions from outer backgrounds toward the center artwork.
  // Sampling inside each row/column reduces sensitivity to single bright highlights.
  for(let y=0;y<h;y+=2){
   let sum=0,count=0;
   for(let x=3;x<w-3;x+=3){const a=4*(y*w+x),b=4*(y*w+x-3);
    sum+=Math.abs(px[a]-px[b])+Math.abs(px[a+1]-px[b+1])+Math.abs(px[a+2]-px[b+2]);count++;
   }
   rows[y]=sum/Math.max(1,count)/3;if(y+1<h)rows[y+1]=rows[y];
  }
  for(let x=0;x<w;x+=2){
   let sum=0,count=0;
   for(let y=3;y<h-3;y+=3){const a=4*(y*w+x),b=4*((y-3)*w+x);
    sum+=Math.abs(px[a]-px[b])+Math.abs(px[a+1]-px[b+1])+Math.abs(px[a+2]-px[b+2]);count++;
   }
   cols[x]=sum/Math.max(1,count)/3;if(x+1<w)cols[x+1]=cols[x];
  }
  const r=smooth(rows,3),cc=smooth(cols,3);
  function findBounds(scores){
   const size=scores.length;
   const central=average(scores.slice(Math.round(size*.34),Math.round(size*.66)));
   const threshold=Math.max(6,central*.65);
   const lo=Math.floor(size*.02),hi=Math.ceil(size*.98),stable=5;
   let left=0,right=size;
   for(let i=lo;i<Math.floor(size*.22);i++){
     if(scores.slice(i,i+stable).every(v=>v>threshold)){left=Math.max(0,i-Math.round(size*.018));break;}
   }
   for(let i=hi-1;i>Math.ceil(size*.78);i--){
     if(scores.slice(i-stable,i).every(v=>v>threshold)){right=Math.min(size,i+Math.round(size*.018));break;}
   }
   if(right-left<size*.7)return[0,size];
   return[left,right];
  }
  const [left,right]=findBounds(cc),[top,bottom]=findBounds(r);
  const rect={x:Math.round(image.naturalWidth*left/w),y:Math.round(image.naturalHeight*top/h),
   w:Math.round(image.naturalWidth*(right-left)/w),h:Math.round(image.naturalHeight*(bottom-top)/h)};
  rect.x=Math.max(0,Math.min(image.naturalWidth-1,rect.x));
  rect.y=Math.max(0,Math.min(image.naturalHeight-1,rect.y));
  rect.w=Math.min(image.naturalWidth-rect.x,Math.max(1,rect.w));
  rect.h=Math.min(image.naturalHeight-rect.y,Math.max(1,rect.h));
  return rect;
 }
 function createDisplay(image,rect,enhance){
  // High-resolution exhibit image, separately derived from untouched original.
  const ratio=Math.min(1,1800/Math.max(rect.w,rect.h));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(rect.w*ratio));c.height=Math.max(1,Math.round(rect.h*ratio));
  const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';
  ctx.filter=enhance?'brightness(1.015) contrast(1.035) saturate(1.04)':'none';
  ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h,0,0,c.width,c.height);
  ctx.filter='none';
  return c;
 }
 function prepare(originalImage){
  if(!originalImage?.naturalWidth||!originalImage?.naturalHeight)throw Error('写真を読み込めません');
  const full={x:0,y:0,w:originalImage.naturalWidth,h:originalImage.naturalHeight};
  const crop=cropSuggestion(originalImage);
  const retained=(crop.w*crop.h)/(full.w*full.h);
  const lowConfidence=retained<.58;
  const rect=lowConfidence?full:crop;
  const recommended=createDisplay(originalImage,rect,true);
  return {
    original:originalImage,
    originalRect:full,
    proposedRect:rect,
    changed:rect.x>0||rect.y>0||rect.w<full.w||rect.h<full.h,
    retained:Math.round(retained*100),
    confidence:lowConfidence?'low':'heuristic',
    recommended,
    fullDisplay:createDisplay(originalImage,full,false)
  };
 }
 window.A18PhotoPrep={prepare,createDisplay,cropSuggestion};
})();
