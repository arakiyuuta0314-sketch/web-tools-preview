'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const base=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
const expected=['エントランス','展示室1','展示室2','展示室3','展示室4','展示室5'];
const sandbox={window:{}};
vm.runInNewContext(read('museum-navigation.js'),sandbox,{filename:'museum-navigation.js'});
assert.deepEqual(Array.from(sandbox.window.A18Navigation.NAMES),expected);

const floorMap=sandbox.window.A18Navigation.mapHTML(1,{
 unlockedThroughLevel:6,newRoomNotices:[]
});
for(const name of expected)assert(floorMap.includes(name),'map missing '+name);
for(const old of ['展示室02','展示室03','展示室04','展示室05','展示室06'])
 assert(!floorMap.includes(old),'old name still on map: '+old);

const editor=read('layout-editor.js');
for(const name of expected)assert(editor.includes(name),'editor missing '+name);
const events=JSON.parse(read('p6-event-dialogue-v1.json'));
assert.deepEqual(events.roomLabels,expected);
for(let lv=2;lv<=6;lv++){
 const evt=events.events.find(e=>e.eventId==='lv'+lv+'-v1');
 assert(evt,'unlock event missing Lv.'+lv);
 assert.equal(evt.openedRoomId,lv-1,'roomId changed');
 assert(evt.systemText.includes('館Lv.'+lv),'level changed');
 assert(evt.systemText.includes('展示室'+(lv-1)),'new room name missing');
}
const completion=events.events.find(e=>e.eventId==='gallery06-complete-v1');
assert(completion,'legacy completion event key must be preserved');
assert.equal(completion.completedRoomId,5);
assert(completion.systemText.includes('展示室5'));
const html=read('index.html');
assert(html.includes('展示室5 完成記念'));
assert(html.includes('roomNumber:galleryIndex+1'),'existing debug API stays unchanged');
for(const name of ['museum-navigation.js','layout-editor.js','p6-event-dialogue-v1.json','index.html']){
 const content=read(name);
 assert(!/展示室0[2-6]|第[2-6]展示室/.test(content),'stale visible label: '+name);
}
console.log('PASS: gallery room labels 1..5; level/unlock IDs, completion event and debug API preserved');
