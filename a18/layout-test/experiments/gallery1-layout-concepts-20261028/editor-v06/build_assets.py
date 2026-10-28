"""Build a portable editable-gallery preview from approved A18 v05 composite layers.

The middle counter is reduced 15 px on BOTH sides:
205px -> 175px, x:410 -> 425 (center 512.5), y396 & height96 unchanged.
All images saved here, never change official game P3 or entrance assets.
"""
from pathlib import Path
from PIL import Image,ImageChops
import json,io,base64
ROOT=Path(__file__).resolve().parent.parent
OUT=Path(__file__).resolve().parent
LAYER=lambda name:Image.open(ROOT/f'gallery1_v05_layer_{name}.png').convert('RGBA')
W,H=930,582
architecture=LAYER('architecture')
rear=LAYER('rear_photo_placeholders')
wall4=LAYER('wall4')
wall5=LAYER('wall5')
counter=LAYER('guide_desk')
foreground=LAYER('side_walls')
p={'wall4':{'x':132,'y':328,'w':240,'h':182},'wall5':{'x':628,'y':286,'w':240,'h':182},
   'counter':{'x':425,'y':396,'w':175,'h':96}}
assert counter.getbbox()==(410,396,615,492)
assert (p['counter']['x']-410)==15 and (615-(p['counter']['x']+175))==15
bg=Image.alpha_composite(architecture,rear)
bg.save(OUT/'architecture.png',optimize=True)
for name,im in [('wall4',wall4),('wall5',wall5)]:
    r=p[name];sub=im.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
    assert sub.getbbox()==(0,0,r['w'],r['h'])
    sub.save(OUT/f'{name}.png',optimize=True)
cropped=counter.crop((410,396,615,492))
resized=cropped.resize((175,96),Image.Resampling.LANCZOS)
resized.save(OUT/'counter175.png',optimize=True)
foreground.save(OUT/'side-walls.png',optimize=True)
combined=bg.copy()
for name in ['wall4','wall5','counter']:
    image=Image.open(OUT/('counter175.png' if name=='counter' else name+'.png')).convert('RGBA')
    r=p[name];combined.alpha_composite(image,(r['x'],r['y']))
combined=Image.alpha_composite(combined,foreground)
combined.save(OUT/'gallery1_v06_counter175_initial.png',optimize=True)
# Independent fixture JSON, for game/production future integration (not an automatic game import)
json_data={
    'schema':'a18-gallery-layout-preview/v1',
    'roomId':1,
    'roomName':'展示室1',
    'canvas':{'width':W,'height':H},
    'exitNorth':{'destination':'展示室3','arch':{'x':290,'y':34,'w':126,'h':184}},
    'entranceEast':{'destination':'エントランス','openY':[226,313]},
    'frameIdsUnchanged':['frame-1-0','frame-1-1','frame-1-2','frame-1-3','frame-1-4'],
    'objects':p,
    'note':'Concept editor state only; game layout, player save, hitboxes and portal logic are not modified.',
}
(OUT/'initial-layout.json').write_text(json.dumps(json_data,ensure_ascii=False,indent=2),encoding='utf8')
assert all(Image.open(OUT/f'{s}.png').size==exp for s,exp in [('architecture',(W,H)),('wall4',(240,182)),('wall5',(240,182)),('counter175',(175,96)),('side-walls',(W,H))])
print('PASS 205->175 centered x=425; layer images generated',[(x.name,x.stat().st_size) for x in OUT.glob('*.png')])
