/* A18 museum traversal: 2x3 connected graph and doors drawn at real passage coordinates. */
(()=>{'use strict';
const POSITIONS={0:[1,1],1:[0,1],2:[2,1],3:[0,0],4:[2,0],5:[1,0]};
const REVERSE={west:'east',east:'west',north:'south',south:'north'};
const NAMES=['エントランス','展示室1','展示室2','展示室3','展示室4','展示室5'];
// Runtime accesses only the architectural openings verified in the
// approved 589x482 backgrounds; no duplicate, obsolete rect table here.
const EDGES={entrance:window.A18Layout.PASSAGES[0],gallery:window.A18Layout.PASSAGES[5]};
function portalEdges(room){
 const edge=window.A18Layout.PASSAGES[room];
 if(!edge)throw Error('E_APPROVED_PASSAGE_ROOM '+room);
 return edge;
}
function validateGraph(links){
 if(Object.keys(links).length!==6)throw Error('館内の部屋数が一致しません');
 for(let room=0;room<6;room++){
  const xy=POSITIONS[room],roomEdges=links[room];
  for(const [edge,target] of Object.entries(roomEdges)){
   if(!Number.isInteger(target)||!(target in POSITIONS))throw Error('移動先が未定義');
   if(links[target][REVERSE[edge]]!==room)throw Error('扉の往復関係が破綻：'+room+' '+edge);
   const other=POSITIONS[target];
   const delta={west:[-1,0],east:[1,0],north:[0,-1],south:[0,1]}[edge];
   if(other[0]-xy[0]!==delta[0]||other[1]-xy[1]!==delta[1])throw Error('館内図と移動関係が不一致：'+room+' '+edge);
   if(!portalEdges(room)[edge])throw Error('扉の当たり判定が未定義：'+room+' '+edge);
  }
 }
 return true;
}
function drawArrow(ctx,dir,x,y){
 const arrows={west:'‹',east:'›',north:'↑',south:'↓'};
 ctx.fillStyle='#f9e6ae';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font='bold 18px system-ui';ctx.fillText(arrows[dir],x,y);
 ctx.textBaseline='alphabetic';
}
function arch(ctx,x,y,w,h){
 ctx.fillStyle='#846341';ctx.fillRect(x-5,y-5,w+10,h+10);
 ctx.fillStyle='#e7bb70';ctx.fillRect(x-2,y-2,w+4,h+4);
 ctx.fillStyle='#2b4037';ctx.fillRect(x+3,y+3,w-6,h-6);
 ctx.fillStyle='#152b27';ctx.fillRect(x+7,y+7,w-14,h-14);
 ctx.strokeStyle='#be9c67';ctx.lineWidth=2;
 ctx.strokeRect(x-5,y-5,w+10,h+10);
}
function drawDoors(ctx,{room,scene,width,height,wallFoot,links,progression}){
 const passages=links[room];
 // Path textures are visual guidance, never a new invisible collision wall.
 for(const edge of Object.keys(passages)){
  const rect=portalEdges(room)[edge];
  const locked=!window.A18P2Store.canTraverse(room,edge,progression);
  if(edge==='north'){
   const cx=(rect.x1+rect.x2)/2;
   // The real movement strip is x≈349..382 and the portal triggers at y=101..118.
   ctx.fillStyle='#d5bc91';ctx.fillRect(cx-22,wallFoot-2,44,27);
   ctx.fillStyle='#c09b68';ctx.fillRect(cx-18,wallFoot-2,36,3);
   arch(ctx,cx-23,78,46,70);
   ctx.fillStyle='#364e42';ctx.fillRect(cx-15,117,30,31);
   if(!locked)drawArrow(ctx,'north',cx,105);
   else lockMark(ctx,cx,105);
  }else if(edge==='south'){
   const cx=(rect.x1+rect.x2)/2;
   ctx.fillStyle='#d1bd99';ctx.fillRect(cx-35,height-58,70,53);
   ctx.fillStyle='#bea276';ctx.fillRect(cx-35,height-34,70,4);
   arch(ctx,cx-34,height-19,68,35);
   if(!locked)drawArrow(ctx,'south',cx,height-5);
   else lockMark(ctx,cx,height-14);
  }else{
   const left=edge==='west';
   const start=left?17:width-61;
   const cy=(rect.y1+rect.y2)/2;
   ctx.fillStyle='#dac4a4';ctx.fillRect(left?31:width-93,cy-20,62,40);
   ctx.fillStyle='#cbb28e';ctx.fillRect(left?33:width-93,cy+14,60,5);
   arch(ctx,start,rect.y1-9,44,rect.y2-rect.y1+18);
   if(!locked)drawArrow(ctx,edge,left?38:width-38,cy);
   else lockMark(ctx,left?38:width-38,cy);
  }
 }
}
function lockMark(ctx,x,y){
 ctx.save();ctx.fillStyle='#ead6a1';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 16px system-ui';ctx.fillText('🔒',x,y);ctx.restore();
}
function mapHTML(room,progression){
 const opened=progression.unlockedThroughLevel;
 const storyOpened=progression.storyUnlockedThroughLevel??opened;
 if(!Number.isInteger(storyOpened)||storyOpened<1||storyOpened>opened)throw Error('E_MAP_STORY_PROGRESS');
 const cells=[];
 for(let row=0;row<2;row++)for(let col=0;col<3;col++){
  const entry=Object.keys(POSITIONS).find(k=>POSITIONS[k][0]===col&&POSITIONS[k][1]===row);
  const n=Number(entry),chosen=n===room,locked=n>=opened,notice=!locked&&progression.newRoomNotices.includes(n);
  cells.push('<div class="a18-room-tile'+(chosen?' current':'')+(locked?' locked':'')+'" aria-label="'+NAMES[n]+(chosen?' 現在地':locked?' 施錠':'')+'"><strong>'+NAMES[n]+'</strong>'+(chosen?'<span>● いまここ</span>':locked?'<span>🔒 Lv.'+(n+1)+'で開放</span>':'<span>'+(n>=storyOpened?'公開設定で利用可能':'開放済み'+(notice?' · NEW':''))+'</span>')+'</div>');
 }
 return '<p class="a18-map-lead">扉に向かって歩くと、隣の部屋へ移動します。</p>'+
 '<div class="a18-floorplan" aria-label="美術館の全6部屋の配置">'+cells.join('')+'</div>'+
 '<p class="a18-map-foot">館内図で現在地を確認できます。</p>';
}
window.A18Navigation={NAMES,POSITIONS,EDGES,portalEdges,validateGraph,drawDoors,mapHTML};
})();