/* Conservative frame-edge suggestion. Keeps every original pixel intact.
   No rectification is performed unless a user explicitly approves the crop. */
(()=>{'use strict';
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
function analyze(img){
 const W=img.naturalWidth,H=img.naturalHeight,k=Math.min(1,480/Math.max(W,H));
 const w=Math.max(24,Math.round(W*k)),h=Math.max(24,Math.round(H*k));
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const t=c.getContext('2d',{willReadFrequently:true});t.drawImage(img,0,0,w,h);
 const px=t.getImageData(0,0,w,h).data,l=new Float32Array(w*h);
 for(let i=0;i<l.length;i++)l[i]=.213*px[i*4]+.715*px[i*4+1]+.072*px[i*4+2];
 function axis(horizontal){
  const n=horizontal?h:w,other=horizontal?w:h;
  const result=[];
  for(let p=3;p<n-3;p++){
   let total=0,strong=0,count=0;
   for(let q=Math.floor(other*.07);q<Math.ceil(other*.93);q+=3){
    const i=horizontal?(p+2)*w+q:q*w+(p+2);
    const j=horizontal?(p-2)*w+q:q*w+(p-2);
    const diff=Math.abs(l[i]-l[j]);
    total+=diff;if(diff>16)strong++;count++;
   }
   result[p]={p,score:total/Math.max(1,count),support:strong/Math.max(1,count)};
  }
  const center=result.filter(x=>x.p>n*.34&&x.p<n*.66).map(x=>x.score).sort((a,b)=>a-b);
  const baseline=center[Math.floor(center.length*.5)]||12;
  function side(left){
   const valid=result.filter(x=>left?x.p>n*.015&&x.p<n*.31:x.p>n*.69&&x.p<n*.985);
   const top=valid.sort((a,b)=>(b.score*(.5+.5*b.support))-(a.score*(.5+.5*a.support))).slice(0,4)[0];
   if(!top||top.score<Math.max(12,baseline*.72)||top.support<.18)return null;
   // Quantify whether there is a genuine continuous border.
   return {...top,relative:top.score/Math.max(1,baseline)};
  }
  return {start:side(true),end:side(false)};
 }
 const xs=axis(false),ys=axis(true);
 if(!xs.start&&!xs.end&&!ys.start&&!ys.end)return null;
 const left=xs.start?xs.start.p/w:0,right=xs.end?xs.end.p/w:1;
 const top=ys.start?ys.start.p/h:0,bottom=ys.end?ys.end.p/h:1;
 if(right-left<.58||bottom-top<.58)return null;
 const area=(right-left)*(bottom-top);
 const count=[xs.start,xs.end,ys.start,ys.end].filter(Boolean).length;
 if(count<2||area<.5||area>.993)return null;
 const rect={x:Math.round(left*W),y:Math.round(top*H),w:Math.round((right-left)*W),h:Math.round((bottom-top)*H)};
 rect.w=Math.min(rect.w,W-rect.x);rect.h=Math.min(rect.h,H-rect.y);
 return{rect,retained:area,edgeCount:count,confidence:count>=4?'medium':'low'};
}
window.A18SmartFrame={analyze};
})();
