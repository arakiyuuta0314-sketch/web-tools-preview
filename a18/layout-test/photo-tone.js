/* Local and reversible photo finishing for the museum. */
(()=>{'use strict';
const bound=(v,a,b)=>Math.max(a,Math.min(b,v));
function profile(img){
 const c=document.createElement('canvas');const k=320/Math.max(img.naturalWidth,img.naturalHeight);
 c.width=Math.max(1,Math.round(img.naturalWidth*k));c.height=Math.max(1,Math.round(img.naturalHeight*k));
 const t=c.getContext('2d',{willReadFrequently:true});t.drawImage(img,0,0,c.width,c.height);
 const a=t.getImageData(0,0,c.width,c.height).data,ys=[],sum=[0,0,0],neutral=[0,0,0];let ns=0,n=0,edges=0;
 for(let y=2;y<c.height;y+=2)for(let x=2;x<c.width;x+=2){
  const i=(y*c.width+x)*4,r=a[i],g=a[i+1],b=a[i+2],lum=.213*r+.715*g+.072*b;
  ys.push(lum);sum[0]+=r;sum[1]+=g;sum[2]+=b;n++;
  if(Math.max(r,g,b)-Math.min(r,g,b)<20&&lum>45&&lum<235){neutral[0]+=r;neutral[1]+=g;neutral[2]+=b;ns++;}
  const j=i-8;edges+=(Math.abs(a[i]-a[j])+Math.abs(a[i+1]-a[j+1])+Math.abs(a[i+2]-a[j+2]))/3;
 }
 ys.sort((a,b)=>a-b);
 const q=v=>ys[Math.floor((ys.length-1)*v)];
 const p10=q(.1),p50=q(.5),p90=q(.9),dr=p90-p10;
 const avg=neutral.map(v=>v/Math.max(ns,1));
 const m=(avg[0]+avg[1]+avg[2])/3;
 const wb=ns>n*.07?avg.map(v=>bound(m/Math.max(v,1),.96,1.04)):[1,1,1];
 return{p10,p50,p90,gamma:bound(1+(123-p50)/290,.90,1.10),
  shadows:p10<58?bound((58-p10)/420,0,.10):0,
  highlights:p90>220?bound((p90-220)/250,0,.10):0,
  contrast:bound(1+(135-dr)/1500,.98,1.055),
  saturation:dr<120?1.035:1.012,
  whiteBalance:wb,sharpness:edges/n>26?.04:.09};
}
function render(img,rect,enhance=true,opt={}){
 const max=opt.maxSize||1800,ratio=Math.min(1,max/Math.max(rect.w,rect.h));
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(rect.w*ratio));c.height=Math.max(1,Math.round(rect.h*ratio));
 const t=c.getContext('2d',{willReadFrequently:true});t.imageSmoothingQuality='high';
 t.drawImage(img,rect.x,rect.y,rect.w,rect.h,0,0,c.width,c.height);
 if(!enhance && opt.sharp===false)return c;
 const tone=enhance?(opt.tone||profile(img)):{
  whiteBalance:[1,1,1],gamma:1,shadows:0,highlights:0,contrast:1,saturation:1
 };
 const frame=t.getImageData(0,0,c.width,c.height),a=frame.data;
 const raw=opt.sharp===false?null:new Uint8ClampedArray(a),width=c.width,height=c.height;
 // Stronger luminance-only sharpening at the original image pixels.
 // Same adjustment on RGB avoids chroma fringes; bounded halos/noise amplification.
 const detail=Math.max(0,Math.min(0.6,opt.sharpStrength??.20));
 const luminance=(j)=>raw[j]*.2126+raw[j+1]*.7152+raw[j+2]*.0722;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;let r=a[i]/255,g=a[i+1]/255,b=a[i+2]/255;
  r=bound(r*tone.whiteBalance[0],0,1);g=bound(g*tone.whiteBalance[1],0,1);b=bound(b*tone.whiteBalance[2],0,1);
  const l=.213*r+.715*g+.072*b,shadow=tone.shadows*(1-l)*(1-l),high=tone.highlights*l*l;
  const tune=v=>bound((Math.pow(v,1/tone.gamma)+shadow-high-.5)*tone.contrast+.5,0,1);
  r=tune(r);g=tune(g);b=tune(b);
  const L=.213*r+.715*g+.072*b;
  r=bound(L+(r-L)*tone.saturation,0,1);g=bound(L+(g-L)*tone.saturation,0,1);b=bound(L+(b-L)*tone.saturation,0,1);
  if(raw&&detail>0&&x>1&&x<width-2&&y>1&&y<height-2){
   const center=luminance(i);
   const neighbor=(luminance(i-4)+luminance(i+4)+luminance(i-width*4)+luminance(i+width*4))*.25;
   const diff=center-neighbor;
   // Reject JPEG speckles (<8) and harsh transitions (>85).
   if(Math.abs(diff)>=8&&Math.abs(diff)<=85){
    const boost=bound(diff*detail,-14,14)/255;
    r=bound(r+boost,0,1);g=bound(g+boost,0,1);b=bound(b+boost,0,1);
   }
  }
  a[i]=r*255;a[i+1]=g*255;a[i+2]=b*255;
 }
 t.putImageData(frame,0,0);return c;
}
window.A18PhotoFinish={profile,render};
})();
