"""Adapt entrance renderer to completely new blank-wall base. Fail on changed upstream text."""
from pathlib import Path
root=Path(__file__).resolve().parent
p=root/"layout-test/entrance-renderer.js"
s=p.read_text("utf-8")
def swap(a,b):
 global s
 n=s.count(a)
 if n!=1:raise RuntimeError(f"expected one old pattern, found {n}: {a[:100]!r}")
 s=s.replace(a,b)
swap("/* A18 v10: canonical v09 background + ratio-aware frames + HQ photo rendering.\n   No save writes; canonical artwork assets are immutable. */",
"""/* A18 clean entrance redraw — independently generated blank architectural base.
   Preserve saved fixture IDs, adaptive frames, and original-resolution photo path.
   This is isolated artwork QA only until explicitly adopted on main. */""")
swap("const ROOT='assets/entrance/v09/',PW=768,PH=576;","const ROOT='assets/entrance/v11/',PW=768,PH=576;")
swap(""" background:[ROOT+'entrance_architecture_v10.png',546,483],
 wall:[ROOT+'entrance_rear_clear_v10.png',546,483],
 rear_left:[ROOT+'rear_left_photo_mask_v09.png',546,483],
 rear_right:[ROOT+'rear_right_photo_mask_v09.png',546,483],
 front:[ROOT+'front_photo_mask_v09.png',546,483],""",
""" background:[ROOT+'entrance_clean_redraw_546x483.png',546,483],
 front:[ROOT+'front_photo_mask_v11.png',546,483],""")
swap(""" {name:'rear_left',rect:[43,64,189,143],patch:[38,58,195,151],center:[116,105]},
 {name:'rear_right',rect:[374,64,506,143],patch:[369,58,511,151],center:[440,105]},
 {name:'front',rect:[421,195,494,326]}""",
""" {name:'rear_left',rect:[49,37,188,137],center:[116,86]},
 {name:'rear_right',rect:[370,37,506,137],center:[440,86]},
 {name:'front',rect:[419,168,506,344]}""")
swap("""const FRONT_INV=[
 [2.2582576554692726,-0.02449889664425458,-854.9873467700153],
 [-0.2933780477833784,1.015847991558277,-7.050709650349285],
 [0.0032571841573975214,-0.000467047182836571,-0.18282765194690226]
];""",
"""const FRONT_INV=[
 [2.216924002295637,-0.007588637919303665,-830.1781549075595],
 [-0.015016830300470565,0.8098809352560739,-59.00931708526596],
 [0.0037950319523461914,-0.00009034092761076227,-0.4149636016721955]
];
const FRONT_QUAD=[[419,168],[505,194],[504,343],[419,285]];""")
swap(""" for(const p of PANELS){
  const c=blank(),cx=c.getContext('2d',{willReadFrequently:true});
  cx.drawImage(imgs.get(p.name),0,0);
  const d=cx.getImageData(0,0,546,483).data,m=new Uint8Array(546*483);
  let count=0;
  for(let i=0;i<m.length;i++){m[i]=d[i*4];if(m[i])count++;}
  if(count<5000||count>20000)throw Error('E_ENTRANCE_V10_MASK '+p.name);
  masks.set(p.name,m);
 }""",
""" const c=blank(),cx=c.getContext('2d',{willReadFrequently:true});
 cx.drawImage(imgs.get('front'),0,0);
 const d=cx.getImageData(0,0,546,483).data,m=new Uint8Array(546*483);
 let count=0;
 for(let i=0;i<m.length;i++){m[i]=d[i*4];if(m[i])count++;}
 if(count<8000||count>15000)throw Error('E_ENTRANCE_V11_FRONT_MASK '+count);
 masks.set('front',m);""")
swap("const caps=sh==='portrait'?[98,111]:sh==='square'?[100,100]:[133,85];",
     "const caps=sh==='portrait'?[94,95]:sh==='square'?[94,94]:[140,81];")
swap("if(x<27||x+outerW>522||y<40||y+outerH>184)throw Error('E_ENTRANCE_V10_BOUNDS '+f.id);",
     "if(x<27||x+outerW>522||y<28||y+outerH>142)throw Error('E_ENTRANCE_V11_BOUNDS '+f.id);")
swap(""" const {outer,inner}=frameGeometry(f,img,preferred),[x0,y0,x1,y1]=p.patch;
 ctx.drawImage(imgs.get('wall'),x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0);""",
""" const {outer,inner}=frameGeometry(f,img,preferred);
 // Blank walls are part of the new redraw; no old matte/repair overlay is used.""")
swap(" ctx.drawImage(m.get(key),0,0);\n}",""" ctx.drawImage(m.get(key),0,0);
 if(p.name==='front'){
  ctx.save();ctx.beginPath();
  ctx.moveTo(FRONT_QUAD[0][0],FRONT_QUAD[0][1]);
  for(let i=1;i<4;i++)ctx.lineTo(FRONT_QUAD[i][0],FRONT_QUAD[i][1]);
  ctx.closePath();ctx.strokeStyle='#5b3418';ctx.lineWidth=5;ctx.stroke();
  ctx.strokeStyle='#c49a56';ctx.lineWidth=2;ctx.stroke();ctx.restore();
 }
}""")
swap("""  ctx.moveTo(421.62,194.73);ctx.lineTo(493.79,228.73);
  ctx.lineTo(489.88,325.87);ctx.lineTo(421.00,277.57);ctx.closePath();""",
"""  ctx.moveTo(FRONT_QUAD[0][0],FRONT_QUAD[0][1]);
  for(let i=1;i<4;i++)ctx.lineTo(FRONT_QUAD[i][0],FRONT_QUAD[i][1]);
  ctx.closePath();""")
p.write_text(s,encoding="utf-8")
html=root/"layout-test/index.html"
h=html.read_text(encoding="utf-8")
old="entrance-renderer.js?v=10-hq-20261026"
assert h.count(old)==1
html.write_text(h.replace(old,"entrance-renderer.js?v=11-clean-redraw-20261027"),encoding="utf-8")
print("renderer adapted; no old wall overlay; live photo projection refit")
