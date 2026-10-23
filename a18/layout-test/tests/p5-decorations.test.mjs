/* P5 v0.2 contract tests (run: node --test a18/layout-test/tests/p5-decorations.test.mjs). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const app=path.resolve(dir,'..');
const root=path.join(app,'assets','p5','v0.2');
const spec=JSON.parse(fs.readFileSync(path.join(root,'p5-manifest.json'),'utf8'));
const script=fs.readFileSync(path.join(app,'museum-p5-decorations.js'),'utf8');
function make(overrides={}){
 const data=overrides.data||spec;
 class FakeImage{
  set src(url){
   const f=path.join(app,url.replaceAll('/',path.sep));
   if(overrides.badImage&&url.includes(overrides.badImage)){queueMicrotask(()=>this.onerror?.());return}
   if(!fs.existsSync(f)){queueMicrotask(()=>this.onerror?.());return}
   const bytes=fs.readFileSync(f);
   this.naturalWidth=bytes.readUInt32BE(16);
   this.naturalHeight=bytes.readUInt32BE(20);
   if(overrides.badDimensions&&url.includes(overrides.badDimensions))this.naturalWidth+=1;
   queueMicrotask(()=>this.onload?.());
  }
 }
 const scope={window:{},fetch:async()=>overrides.badFetch?{ok:false,status:404}:{ok:true,json:async()=>data},Image:FakeImage,Map,Set,Error,JSON,Number,Object,Array,Promise};
 vm.runInNewContext(script,scope,{filename:'museum-p5-decorations.js'});
 return scope.window.A18P5Decorations;
}
test('66 genuine RGBA8 assets match v0.2 SHA-256 and dimensions',()=>{
 assert.equal(spec.assets.length,66);
 for(const a of spec.assets){
  const b=fs.readFileSync(path.join(root,a.path));
  assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,a.path);
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(b[24],8);
  assert.equal(b[25],6);
  assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],a.size);
 }
});
test('all 36 cumulative PNGs loaded and only unlocked rooms paint exactly once',async()=>{
 const p=make();await p.init();assert.equal(p.ready(),true);assert.equal(p.assetCount(),36);
 assert.equal(p.mode,'cumulative');
 for(let level=1;level<=6;level++){
  for(let room=0;room<6;room++){
   const prog={unlockedThroughLevel:level};
   const prefix=room===0?'entrance':'gallery0'+(room+1);
   const pathExpected=room>=level?null:'assets/p5/v0.2/01_assets/cumulative/'+prefix+'_cumulative_lv'+level+'_v02.png';
   assert.equal(p.resolve(room,prog),pathExpected);
   let draws=0;
   const ctx={save(){},restore(){},drawImage(){draws++}};
   assert.equal(p.paint(ctx,room,prog),room<level);
   assert.equal(draws,room<level?1:0);
  }
 }
});
test('invalid progression and room fail-fast',async()=>{
 const p=make();await p.init();
 for(const level of [0,7,-1,1.5,null,undefined]){
  assert.throws(()=>p.resolve(0,{unlockedThroughLevel:level}),/E_P5_LEVEL_INVALID/);
 }
 assert.throws(()=>p.resolve(8,{unlockedThroughLevel:6}),/E_P5_ROOM_INVALID/);
});
test('missing manifest, missing content and mismatched dimensions fail visibly',async()=>{
 await assert.rejects(make({badFetch:true}).init(),/E_P5_MANIFEST_FETCH/);
 const broken=structuredClone(spec);delete broken.rooms['1'].cumulative['3'];
 await assert.rejects(make({data:broken}).init(),/E_P5_MANIFEST_PATH|E_P5_CUMULATIVE_MISSING/);
 await assert.rejects(make({badImage:'gallery02_cumulative_lv2'}).init(),/E_P5_ASSET_LOAD/);
 await assert.rejects(make({badDimensions:'gallery02_cumulative_lv2'}).init(),/E_P5_ASSET_DIMENSION/);
});
