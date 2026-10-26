/* A18: non-destructive four-corner perspective rectification, all processing local. */
(()=>{'use strict';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
function initial(img,crop=null){
 const w=img.naturalWidth,h=img.naturalHeight;
 if(!w||!h)throw Error('E_PERSPECTIVE_SOURCE');
 const box=crop||{x:w*.04,y:h*.04,w:w*.92,h:h*.92};
 return [
  {x:box.x,y:box.y},{x:box.x+box.w,y:box.y},
  {x:box.x+box.w,y:box.y+box.h},{x:box.x,y:box.y+box.h}
 ];
}
function validate(width,height,points){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<4||height<4||
    !Array.isArray(points)||points.length!==4)throw Error('E_PERSPECTIVE_POINTS');
 for(const p of points){
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||
   p.x<0||p.x>width-1||p.y<0||p.y>height-1)
   throw Error('E_PERSPECTIVE_OUT_OF_BOUNDS');
 }
 const minLength=Math.min(width,height)*.035;
 for(let i=0;i<4;i++){
  if(length(points[i],points[(i+1)%4])<minLength)throw Error('E_PERSPECTIVE_TOO_NARROW');
 }
 // Four convex corners in TL,TR,BR,BL order; never accept a folded quadrilateral.
 const area2=points.reduce((sum,p,i)=>{
  const next=points[(i+1)%4];return sum+p.x*next.y-next.x*p.y;
 },0);
 if(area2<width*height*.003)throw Error('E_PERSPECTIVE_AREA');
 for(let i=0;i<4;i++){
  const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4];
  const cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
  if(cross<=width*height*.0002)throw Error('E_PERSPECTIVE_NON_CONVEX');
 }
 return points;
}
function solve(points){
 // Inverse homography from unit rect(u,v) to four source-image corners.
 const dst=[[0,0],[1,0],[1,1],[0,1]],rows=[];
 for(let i=0;i<4;i++){
  const [u,v]=dst[i],p=points[i];
  rows.push([u,v,1,0,0,0,-u*p.x,-v*p.x,p.x]);
  rows.push([0,0,0,u,v,1,-u*p.y,-v*p.y,p.y]);
 }
 for(let k=0;k<8;k++){
  let pivot=k;
  for(let j=k+1;j<8;j++)if(Math.abs(rows[j][k])>Math.abs(rows[pivot][k]))pivot=j;
  if(Math.abs(rows[pivot][k])<1e-11)throw Error('E_PERSPECTIVE_SINGULAR');
  [rows[k],rows[pivot]]=[rows[pivot],rows[k]];
  const m=rows[k][k];
  for(let j=k;j<=8;j++)rows[k][j]/=m;
  for(let i=0;i<8;i++)if(i!==k){
   const z=rows[i][k];if(z===0)continue;
   for(let j=k;j<=8;j++)rows[i][j]-=z*rows[k][j];
  }
 }
 return rows.map(row=>row[8]);
}
function dimensions(points,maxEdge){
 if(!Number.isInteger(maxEdge)||maxEdge<8||maxEdge>4096)throw Error('E_PERSPECTIVE_OUTPUT_LIMIT');
 const [a,b,c,d]=points;
 const estimatedW=(length(a,b)+length(c,d))/2;
 const estimatedH=(length(b,c)+length(d,a))/2;
 const ratio=Math.min(1,maxEdge/Math.max(estimatedW,estimatedH));
 return {width:Math.max(2,Math.round(estimatedW*ratio)),
  height:Math.max(2,Math.round(estimatedH*ratio))};
}
function render(img,points,maxEdge=4096){
 validate(img.naturalWidth,img.naturalHeight,points);
 const {width:dw,height:dh}=dimensions(points,maxEdge),matrix=solve(points);
 const source=document.createElement('canvas');
 source.width=img.naturalWidth;source.height=img.naturalHeight;
 const sc=source.getContext('2d',{willReadFrequently:true});
 sc.drawImage(img,0,0);
 const sw=source.width,sh=source.height;
 const pixels=sc.getImageData(0,0,sw,sh).data;
 const dest=document.createElement('canvas');dest.width=dw;dest.height=dh;
 const dc=dest.getContext('2d',{willReadFrequently:true});
 const output=dc.createImageData(dw,dh),data=output.data;
 const [a,b,c,e,f,g,h,i]=matrix;
 for(let y=0;y<dh;y++){
  const v=dh===1?0:y/(dh-1),vX=b*v+c,vY=f*v+g,vD=i*v+1;
  for(let x=0;x<dw;x++){
   const u=dw===1?0:x/(dw-1),den=h*u+vD;
   if(Math.abs(den)<1e-10)throw Error('E_PERSPECTIVE_DENOMINATOR');
   const sx=clamp((a*u+vX)/den,0,sw-1),sy=clamp((e*u+vY)/den,0,sh-1);
   const x0=Math.floor(sx),y0=Math.floor(sy);
   const x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1);
   const fx=sx-x0,fy=sy-y0,top=1-fy,xx=1-fx;
   const i00=(y0*sw+x0)*4,i10=(y0*sw+x1)*4;
   const i01=(y1*sw+x0)*4,i11=(y1*sw+x1)*4;
   const out=(y*dw+x)*4;
   for(let ch=0;ch<4;ch++)
    data[out+ch]=(pixels[i00+ch]*xx+pixels[i10+ch]*fx)*top+
                 (pixels[i01+ch]*xx+pixels[i11+ch]*fx)*fy;
  }
 }
 dc.putImageData(output,0,0);
 return dest;
}
window.A18PhotoPerspective={initial,validate,render,dimensions,solve};
})();