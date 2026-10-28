"""v04 Gallery1 layout alternatives, using approved B v03 architecture and real entrance-style elements.
Creates supervision previews, not live A18 changes.
"""
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
from shared_gallery_art_style_v01 import render_base,draw_north_passage,draw_rear_frames,place_exhibition_wall,place_display_feature,font
P=Path(__file__).resolve().parent
W,H=930,582
manifest=json.loads((P/'gallery1_B_north_manifest_v02.json').read_text(encoding='utf8'))
fixed={'northExit':[290,34,126,184],'westWallClosed':True,'eastEntranceY':[226,313],
       'rearFrames':manifest['wallFrames'],'floorSize':[W,H],'frameCount':5}
background=render_base(W,H,bays=4,side_openings=('right',))
draw_north_passage(background,*fixed['northExit'])
draw_rear_frames(background,fixed['rearFrames'])
walls=Image.open(P/'gallery1_B_side_walls_layer_v03.png').convert('RGBA')
baseline=Image.alpha_composite(background.copy(),walls)
baseline.save(P/'gallery1_v04_fixed_architecture.png')
versions={
'P_stagger':{'label':'P 前後差を強める','left':[132,328,240,182],'right':[628,286,240,182],
             'desk':[410,396,205,96],'character':'奥の右壁を先に見せ、左の壁は手前で出会う'},
'Q_open':{'label':'Q 余白を優先','left':[123,300,240,182],'right':[608,335,240,182],
          'desk':[390,395,205,96],'character':'通路と作品前の歩行余地を優先する'},
'R_asym':{'label':'R 左を低く、右を奥へ','left':[96,332,240,182],'right':[599,285,240,182],
          'desk':[369,397,205,96],'character':'中央の空きを広く見せ、左端にも回り込める'},
}
from math import ceil
sheets={}
for key,c in versions.items():
    scene=background.copy()
    lx,ly,lw,lh=c['left'];rx,ry,rw,rh=c['right']
    place_exhibition_wall(scene,lx,ly,lw,lh,4,True)
    place_exhibition_wall(scene,rx,ry,rw,rh,5,False)
    place_display_feature(scene,*c['desk'])
    scene=Image.alpha_composite(scene,walls)
    scene.save(P/f'gallery1_v04_{key}.png',optimize=True)
    sheets[key]=scene.convert('RGB')
    # Synthetic views: the fixed viewport width=350 logical px, no simulated character.
    crops=[scene.crop((x,0,x+350,H)).convert('RGB') for x in (W-350,(W-350)//2,0)]
    strip=Image.new('RGB',(1050,H),'white')
    for i,img in enumerate(crops):strip.paste(img,(350*i,0))
    strip.save(P/f'gallery1_v04_{key}_walk_views.png',optimize=True)
    assert scene.size==(W,H)
# overview with explicit same base
CW=1240;HEIGHT=2490
out=Image.new('RGB',(CW,HEIGHT),'#F3F5F1')
d=ImageDraw.Draw(out)
d.rounded_rectangle((24,20,CW-24,117),radius=18,fill='#284A3A')
d.text((59,33),'展示室1｜配置だけを変えた3案',font=font(36,True),fill='white')
d.text((61,80),'壁・入口・北通路・奥の展示3枠は共通',font=font(21),fill='#DEEEE4')
for i,(key,c) in enumerate(versions.items()):
    top=136+i*775
    d.rounded_rectangle((26,top,CW-26,top+756),radius=14,fill='#FFFFFF',outline='#D5DFD4',width=3)
    d.text((56,top+12),c['label'],font=font(30,True),fill='#325E44')
    d.text((57,top+61),c['character'],font=font(21),fill='#5B7564')
    pic=sheets[key]
    out.paste(pic,((CW-W)//2,top+105))
    d.text((55,top+700),'右奥：エントランスから　／　北壁：展示室3へ',font=font(20),fill='#667C6B')
out.save(P/'gallery1_v04_positions_3way_comparison.png',optimize=True)
data={'baseline':'gallery1_B_west_east_walls_v03.png','fixed':fixed,'options':versions,
      'scope':'concept still images; unchanged official game','frameIds':['frame-1-0','frame-1-1','frame-1-2','frame-1-3','frame-1-4']}
(P/'gallery1_v04_layout_options.json').write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf8')
print('PASS',[(k,c['left'],c['right'],c['desk']) for k,c in versions.items()])
