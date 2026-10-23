/* A18 gallery 1 art v0.1; isolated from gameplay and save data. */
(()=>{'use strict';
let image=null;
async function init(){
 if(image)return;
 image=await new Promise((resolve,reject)=>{
  const im=new Image();
  im.onload=()=>resolve(im);
  im.onerror=()=>reject(Error('展示室1背景の読込に失敗しました'));
  im.src='assets/gallery1/v0.1/gallery1_background_v01.png';
 });
 if(image.naturalWidth!==589||image.naturalHeight!==482)throw Error('展示室1背景の寸法が不正です');
}
function background(ctx){
 if(!image)throw Error('展示室1背景が未初期化です');
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0);ctx.restore();
}
window.A18Gallery1={init,background};
})();