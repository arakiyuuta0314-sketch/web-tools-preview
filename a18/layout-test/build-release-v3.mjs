/* A18 v3 closed QA staging build: no deployment, public upload or iOS packaging. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const target=path.resolve(process.argv[2]||path.join(process.env.TEMP||'C:/Temp','a18-v3-audit-release'));
const dev=process.argv.includes('--dev');
if(target===source||target.startsWith(source+path.sep))throw Error('E_BUILD_OUTPUT_INSIDE_SOURCE');
if(!fs.existsSync(path.join(source,'index.html')))throw Error('E_ENTRY_MISSING');
const extensionOK=new Set(['.html','.js','.mjs','.css','.json','.webmanifest','.png','.jpg','.jpeg','.webp','.svg','.gif','.ico','.woff','.woff2']);
const bannedRoot=new Set(['layout-storage.js','layout-editor.js','layout-editor.css','art-inspect-test.js']);
fs.rmSync(target,{force:true,recursive:true});fs.mkdirSync(target,{recursive:true});
const gameOut=path.join(target,'layout-test');
const copied=[];
function walk(dir,rel=''){
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(ent.name==='tests'||ent.name==='.git'||ent.name==='node_modules')continue;
  if(rel===''&&bannedRoot.has(ent.name))continue;
  if(rel===''&&ent.name==='build-release-v3.mjs')continue;
  if(rel===''&&ent.name.endsWith('.html')&&ent.name!=='index.html')continue;
  const r=path.join(rel,ent.name),f=path.join(dir,ent.name),dst=path.join(gameOut,r);
  if(ent.isDirectory()){walk(f,r);continue}
  if(!ent.isFile()||!extensionOK.has(path.extname(ent.name).toLowerCase()))continue;
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.copyFileSync(f,dst);
  copied.push(r.replaceAll('\\','/'));
 }
}
walk(source);
// Keep the P5 runtime manifest (required at boot), but strip authoring-only and local-drive references.
if(!dev){
 const p5file=path.join(gameOut,'assets/p5/v0.2/p5-manifest.json');
 const p5=JSON.parse(fs.readFileSync(p5file,'utf8'));
 const only=(obj,keys)=>Object.fromEntries(keys.map(k=>[k,obj[k]]));
 const rooms=Object.fromEntries(Object.entries(p5.rooms).map(([n,v])=>[n,only(v,['roomId','opens_at_level','size','cumulative','increments','fixture_ids'])]));
 const runtime={...only(p5,['version','room_count','frame_count','portal_edge_count']),rooms,
   assets:p5.assets.map(a=>only(a,['path','size','roomId','sha256','kind','level']))};
 fs.writeFileSync(p5file,JSON.stringify(runtime));
}
// The approved manifest points to ../scenes-preview/assets: retain this sibling path.
const officialAssets=path.resolve(source,'../scenes-preview/assets');
if(!fs.existsSync(officialAssets))throw Error('E_OFFICIAL_CHARACTER_ASSETS_MISSING');
// Distribute approved characters only, never raw author handoff, old previews or production-irrelevant art.
const approved=path.join(officialAssets,'official');
const chars=path.join(approved,'characters');
const charNames=fs.readdirSync(chars).filter(name=>name.endsWith('.png'));
if(charNames.length!==48)throw Error('E_APPROVED_CHARACTER_COUNT '+charNames.length);
const charOut=path.join(target,'scenes-preview/assets/official/characters');
fs.mkdirSync(charOut,{recursive:true});
for(const name of charNames)fs.copyFileSync(path.join(chars,name),path.join(charOut,name));
fs.copyFileSync(path.join(approved,'manifest.json'),path.join(charOut,'../manifest.json'));
const htmlPath=path.join(gameOut,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
const store=fs.readFileSync(path.join(gameOut,'museum-p2-storage.js'),'utf8');
if(!store.includes("DATABASE='a18-totteoki-museum-v3'")||!store.includes("E_SAVE_LIVE_CORRUPT"))throw Error('E_BUILD_STORE_MISMATCH');
if(/setFault|testMode|p2-e2e|a18-museum-p2-isolated-v3|indexedDB\.deleteDatabase/.test(store)||/museum-p2-storage\.js\?v=p4a|layout-storage\.js|p2-e2e/.test(html))throw Error('E_BUILD_DEBUG_LEAK');
if(dev){
 html=html.replace('</head>','<meta name="a18-build" content="development"></head>')
  .replace('</body>','<script src="dev-reset.js" defer></script></body>');
 fs.copyFileSync(path.join(source,'tests/v3-release/dev-reset.js'),path.join(gameOut,'dev-reset.js'));
 copied.push('dev-reset.js');
}else{
 html=html.replace('</head>','<link rel="icon" href="data:,"/><meta name="a18-build" content="release"></head>');
}
fs.writeFileSync(htmlPath,html);
if(!dev&&fs.existsSync(path.join(gameOut,'dev-reset.js')))throw Error('E_BUILD_RESET_LEAK');
for(const name of copied.filter(v=>v.endsWith('.js'))){
 const content=fs.readFileSync(path.join(gameOut,name),'utf8');
 if(!dev&&/(?:deleteDatabase\s*\(|setFault\s*\(|resetMuseum\s*\()/.test(content))throw Error('E_BUILD_DANGEROUS_CODE '+name);
}
const entries=[];
for(const name of copied){
 const b=fs.readFileSync(path.join(gameOut,name));
 entries.push({file:name,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});
}
// Include every distributed byte (including character images) in a verifiable, relative-path index.
const allFiles=[];
function inventory(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
 const fp=path.join(dir,ent.name);
 if(ent.isDirectory()){inventory(fp);continue}
 if(!ent.isFile())throw Error('E_BUILD_NONFILE '+fp);
 const buffer=fs.readFileSync(fp);
 allFiles.push({file:path.relative(target,fp).replaceAll('\\','/'),bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
}}
inventory(target);
allFiles.sort((a,b)=>a.file.localeCompare(b.file));
fs.writeFileSync(path.join(target,'_a18_build_manifest.json'),JSON.stringify({flavor:dev?'development':'release',source,files:entries,allFiles},null,2));
console.log(JSON.stringify({target,entry:'layout-test/index.html',flavor:dev?'development':'release',files:entries.length,bytes:entries.reduce((n,x)=>n+x.bytes,0),db:'a18-totteoki-museum-v3',resetIncluded:dev}));
