/* A18 walk/collision visualization: derives from LIVE game functions.
   Diagnostic only. No hit boxes, story, save data or movement are changed. */
(()=>{'use strict';
const GRID=4;
const colors={walk:'#72f5a6',block:'#ff7162',portal:'#43d6ff',locked:'#f7b45a',arrival:'#ffffff'};
let cacheKey='',outline=null;
function triggerRect(room,dir,r){
 // These bounds are exact portalDirection() conditions from the game:
 // west/east 19px edge strip; north/south 4px threshold; 6px X,4px Y insets.
 if(dir==='west')return {x:r.x1,y:r.y1+4,w:19,h:Math.max(0,r.y2-r.y1-8)};
 if(dir==='east')return {x:r.x2-19,y:r.y1+4,w:19,h:Math.max(0,r.y2-r.y1-8)};
 if(dir==='north')return {x:r.x1+6,y:r.y1,w:Math.max(0,r.x2-r.x1-12),h:Math.max(0,r.y2-r.y1-4)};
 if(dir==='south')return {x:r.x1+6,y:r.y1+4,w:Math.max(0,r.x2-r.x1-12),h:Math.max(0,r.y2-r.y1-8)};
 throw Error('E_COLLISION_OVERLAY_DIRECTION '+dir);
}
function createOutline({width,height,canMove}){
 const c=document.createElement('canvas');
 c.width=width;c.height=height;
 const g=c.getContext('2d',{alpha:true});
 const nx=Math.ceil(width/GRID),ny=Math.ceil(height/GRID),bits=new Uint8Array(nx*ny);
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const px=Math.min(width-1,(x+.5)*GRID),py=Math.min(height-1,(y+.5)*GRID);
  bits[y*nx+x]=canMove(px,py)?1:0;
 }
 // Outline the *actual reachable floor* rather than outlining the decorative
 // external black canvas frame. Contours are built from the same safeMove used
 // by the cursor and movement engine, including staff and independent walls.
 g.strokeStyle=colors.walk;g.lineWidth=2;g.lineCap='square';
 g.beginPath();
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  if(!bits[y*nx+x])continue;
  const l=x*GRID,t=y*GRID,r=Math.min(width,(x+1)*GRID),b=Math.min(height,(y+1)*GRID);
  if(x===0||!bits[y*nx+x-1]){g.moveTo(l,t);g.lineTo(l,b);}
  if(x===nx-1||!bits[y*nx+x+1]){g.moveTo(r,t);g.lineTo(r,b);}
  if(y===0||!bits[(y-1)*nx+x]){g.moveTo(l,t);g.lineTo(r,t);}
  if(y===ny-1||!bits[(y+1)*nx+x]){g.moveTo(l,b);g.lineTo(r,b);}
 }
 g.stroke();
 return c;
}
function paint(ctx,{room,worldWidth,worldHeight,canMove,passages,arrivals,obstacles,canTraverse,storyLevel,publicLevel}){
 if(!Number.isInteger(room)||room<0||room>5)throw Error('E_COLLISION_OVERLAY_ROOM');
 const key=[room,worldWidth,worldHeight,storyLevel,publicLevel].join('|');
 if(cacheKey!==key||!outline){outline=createOutline({width:worldWidth,height:worldHeight,canMove});cacheKey=key;}
 ctx.save();
 ctx.drawImage(outline,0,0);
 // Material obstruction rectangles are shown from the *same* obstacle table.
 for(let i=0;i<obstacles.length;i++){
  const [x1,x2,y1,y2]=obstacles[i];
  ctx.fillStyle='rgba(255,113,98,.22)';ctx.fillRect(x1,y1,x2-x1,y2-y1);
  ctx.strokeStyle=colors.block;ctx.lineWidth=1.5;ctx.setLineDash([5,3]);
  ctx.strokeRect(x1+.5,y1+.5,x2-x1,y2-y1);ctx.setLineDash([]);
 }
 for(const [dir,r] of Object.entries(passages)){
  const open=canTraverse(dir),t=triggerRect(room,dir,r),cx=t.x+t.w/2,cy=t.y+t.h/2;
  // Gold thin outline = visible aperture in the approved background;
  // cyan filled strip = actual scene-transition trigger, which is SMALLER.
  ctx.strokeStyle=colors.locked;ctx.lineWidth=1.4;ctx.setLineDash([4,4]);
  ctx.strokeRect(r.x1+.5,r.y1+.5,r.x2-r.x1,r.y2-r.y1);ctx.setLineDash([]);
  ctx.fillStyle=open?'rgba(67,214,255,.38)':'rgba(247,180,90,.28)';
  ctx.fillRect(t.x,t.y,t.w,t.h);
  ctx.strokeStyle=open?colors.portal:colors.locked;ctx.lineWidth=2;
  ctx.strokeRect(t.x+.4,t.y+.4,t.w,t.h);
  ctx.fillStyle='#0b2723';ctx.font='bold 11px system-ui';ctx.textAlign='center';
  const arrow={north:'↑',south:'↓',west:'←',east:'→'}[dir];
  ctx.fillText(arrow+(open?'移動':'閉'),cx,cy-5);
 }
 // The white crosses are the production changeScene ARRIVALS, not guessed
 // entry points. They are independent from the cyan trigger strips.
 ctx.lineWidth=2;
 for(const [dir,p] of Object.entries(arrivals)){
  ctx.strokeStyle=colors.arrival;ctx.fillStyle='rgba(11,37,31,.82)';
  ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(p.x-13,p.y);ctx.lineTo(p.x+13,p.y);
  ctx.moveTo(p.x,p.y-13);ctx.lineTo(p.x,p.y+13);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold 10px system-ui';ctx.textAlign='left';
  ctx.fillText('入室 '+dir,p.x+13,p.y-11);
 }
 ctx.restore();
}
window.A18CollisionOverlay=Object.freeze({paint,triggerRect,invalidate:()=>{cacheKey='';outline=null;}});
})();