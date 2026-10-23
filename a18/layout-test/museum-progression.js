/* A18 fixed museum upgrades: provisional work-count thresholds, no draggable props. */
(()=>{'use strict';
const THRESHOLDS=[0,5,12,20];
function levelFor(total){
 if(!Number.isInteger(total)||total<0)throw Error('作品数が不正');
 let value=1;for(const t of THRESHOLDS)if(total>=t)value++;
 return Math.min(4,value-1);
}
function draw(ctx,room,wallFoot,w,h,level){
 if(level<2)return;
 ctx.save();
 ctx.fillStyle=level>=4?'#b18a46':'#c6a66f';
 ctx.fillRect(20,28,w-40,3);
 ctx.fillRect(20,wallFoot-15,w-40,level>=3?4:2);
 if(level>=3){
  ctx.strokeStyle='#ab8141';ctx.lineWidth=3;
  ctx.strokeRect(24,26,w-48,wallFoot-39);
  ctx.fillStyle='#e6cd8c';
  for(const x of [35,w-35]){
   ctx.fillRect(x-5,wallFoot+7,10,4);
   ctx.fillRect(x-2,wallFoot+11,4,12);
  }
 }
 if(level>=4){
  ctx.fillStyle='#d7be83';
  for(const y of [wallFoot+35,h-43]){
   ctx.fillRect(38,y,16,3);
   ctx.fillRect(w-54,y,16,3);
  }
 }
 ctx.restore();
}
window.A18MuseumProgression={THRESHOLDS,levelFor,draw};
})();
