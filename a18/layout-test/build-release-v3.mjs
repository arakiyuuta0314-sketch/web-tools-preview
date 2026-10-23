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
// The approved manifest points to ../scenes-preview/assets: retain this sibling path.
const officialAssets=path.resolve(source,'../scenes-preview/assets');
if(!fs.existsSync(officialAssets))throw Error('E_OFFICIAL_CHARACTER_ASSETS_MISSING');
fs.cpSync(officialAssets,path.join(target,'scenes-preview/assets'),{recursive:true});
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
 html=html.replace('</head>','<meta name="a18-build" content="release"></head>');
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
fs.writeFileSync(path.join(target,'_a18_build_manifest.json'),JSON.stringify({flavor:dev?'development':'release',source,files:entries},null,2));
console.log(JSON.stringify({target,entry:'layout-test/index.html',flavor:dev?'development':'release',files:entries.length,bytes:entries.reduce((n,x)=>n+x.bytes,0),db:'a18-totteoki-museum-v3',resetIncluded:dev}));
