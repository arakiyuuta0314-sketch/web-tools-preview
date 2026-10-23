/* A18 gallery one v0.2, isolated visual background. */
(()=>{'use strict';
let image=null;
async function init(){
 if(image)return;
 image=await new Promise((resolve,reject)=>{
  const im=new Image();
  im.onload=()=>resolve(im);
  im.onerror=()=>reject(Error('Gallery one image load failed'));
  im.src='assets/gallery1/v0.2/gallery1_background_v02.png';
 });
 if(image.naturalWidth!==589||image.naturalHeight!==482)throw Error('Gallery one image dimensions invalid');
}
function background(ctx){
 if(!image)throw Error('Gallery one image not ready');
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0);ctx.restore();
}
window.A18Gallery1={init,background};
})();