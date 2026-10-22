import fs from 'node:fs';
import path from 'node:path';
const home = 'C:/Users/User/source/repos/';
const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const apps = [
  ['coin-jar-500/www', 'coin-jar', '#web-ad-placeholder,#purchase,#restore-purchase,#ad-privacy-options,.ad-test-diagnostic{display:none!important}'],
  ['watashi-nenpyo/www', 'myprof', '#preview-ad,#custom-inline-ad{display:none!important}'],
  ['a16-wish-note/www', 'wish-note', '.ad-space,#ads-privacy-button,#remove-ads-button,#restore-purchases-button{display:none!important}']
];
const allowed = new Set(['.html','.css','.js','.mjs','.json','.webp','.png','.jpg','.jpeg','.svg','.mp3','.wav','.ogg','.txt','.ico','.woff','.woff2']);
function audit(dir) {
  const files=[];
  for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
    const abs=path.join(dir,item.name);
    if(item.isDirectory()) files.push(...audit(abs));
    else if(item.isFile()) {
      const size=fs.statSync(abs).size;
      if(!allowed.has(path.extname(abs).toLowerCase())||size>20*1024*1024) throw Error('Unexpected public file: '+abs);
      if(['.html','.js','.css','.json','.txt'].includes(path.extname(abs).toLowerCase())) {
        const s=fs.readFileSync(abs,'utf8');
        if(/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{25,}|sk_live_[A-Za-z0-9]+/i.test(s)) throw Error('Possible secret: '+abs);
      }
      files.push([abs,size]);
    }
  }
  return files;
}
for(const [source,target,hide] of apps) {
  const src=path.join(home,source),dst=path.join(out,target);
  audit(src);fs.rmSync(dst,{recursive:true,force:true});fs.cpSync(src,dst,{recursive:true});
  const html=path.join(dst,'index.html');let content=fs.readFileSync(html,'utf8');
  if(!content.includes('</head>')) throw Error('Missing head: '+source);
  content=content.replace('</head>','<meta name="robots" content="noindex, nofollow, noarchive"><link rel="stylesheet" href="./web-preview.css">\n</head>');
  fs.writeFileSync(html,content);
  fs.writeFileSync(path.join(dst,'web-preview.css'),hide+'\n');
  const files=audit(dst);console.log(target+': '+files.length+' files, '+(files.reduce((a,b)=>a+b[1],0)/1048576).toFixed(2)+' MiB');
}
console.log('Static Web previews ready. No iPhone source repositories modified.');