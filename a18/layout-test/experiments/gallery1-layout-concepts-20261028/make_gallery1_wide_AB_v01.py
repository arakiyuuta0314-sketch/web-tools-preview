"""Exhibition Room 1 wide B1-based concepts, original entrance Lv1 approved style.
Two strict alternative room layouts using same width, height, exits and photographic placeholders.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,math
from shared_gallery_art_style_v01 import (
    render_base, place_exhibition_wall,place_display_feature,draw_rear_frames,font,
    BG_PATH,PANEL_PATH,COUNTER_PATH
)
OUT=Path(__file__).resolve().parent
W,H=930,582
REAR=[(97,79,130,85),(398,79,130,85),(705,79,130,85)]
ENTRANCE={'edge':'right','spanY':[225,309],'scenePoint':[885,259]}
EXIT={'edge':'left','spanY':[225,309],'scenePoint':[45,259],'destination':'undecided'}

CONFIG={
 'A_wall_6frames':{
  'shortLabel':'A｜展示壁を増やす', 'facility':None,
  'freestanding':[(75,288,240,182,4,True),
                  (353,324,240,182,5,False),
                  (635,295,240,182,6,False)],
  'frameCount':6,
  'description':'奥3枚＋独立壁3枚。作品の見え方が横スクロールに伴って変化する。',
  'risk':'従来の5枠から6枠になるため、正式採用時は進行条件・保存の改修要否を判断。'},
 'B_feature_5frames':{
  'shortLabel':'B｜展示壁＋展示案内台','facility':(399,359,205,96),
  'freestanding':[(142,301,240,182,4,True),
                  (635,322,240,182,5,False)],
  'frameCount':5,
  'description':'奥3枚＋独立壁2枚＋小さな木製の展示案内台。展示だけの部屋にしない。',
  'risk':'展示案内台は仮施設。展示室の機能・装飾レベルの確定を意味しない。'}
}

def make(c):
    img=render_base(W,H,bays=3)
    draw_rear_frames(img,REAR)
    for x,y,w,h,idx,mirror in c['freestanding']:
        place_exhibition_wall(img,x,y,w,h,idx,mirror)
    if c['facility'] is not None:place_display_feature(img,*c['facility'])
    return img
IMGS={}
for k,c in CONFIG.items():
    img=make(c)
    IMGS[k]=img
    img.save(OUT/f'gallery1_wide_{k}_v01.png',optimize=True)

# Exact same geometry (new room design) has identical painted background.
# Position and independent wall shape are the only differences.
back=render_base(W,H,bays=3)
draw_rear_frames(back,REAR)
back.save(OUT/'gallery1_wide_shared_architecture_v01.png',optimize=True)

# The following comparative panels do not alter game art; movement arrows are visualization only.
S=1400
sheet=Image.new('RGB',(S,2005),'#F3F5F1')
d=ImageDraw.Draw(sheet)
d.rounded_rectangle((26,20,S-26,137),radius=18,fill='#234737')
d.text((62,43),'展示室1｜横長 B1 の2パターン',font=font(47,True),fill='#FFFFFF')
d.text((64,102),'現行エントランスLv.1素材を再利用／壁・床・展示設備のみの仮配置',font=font(22),fill='#D6E8DB')
def box(y,name,c,im):
    d.rounded_rectangle((30,y,S-30,y+880),radius=18,fill='white',outline='#D2DFD6',width=3)
    d.text((65,y+21),c['shortLabel'],font=font(36,True),fill='#275C40')
    d.text((65,y+80),c['description'],font=font(21),fill='#506C5D')
    # 1:1 architecture preview (930x582), sharp legibility of placement.
    scene=im.convert('RGB')
    left=(S-W)//2
    sy=y+139
    sheet.paste(scene,(left,sy))
    d.text((left+6,sy+H+12),'← 左奥：次室へ（仮出口）',font=font(19),fill='#2C6586')
    d.text((left+W-245,sy+H+12),'右奥：エントランスから →',font=font(19),fill='#2C6586')
    d.text((left,sy+H+52),f"展示枠：{c['frameCount']} 枠　／　部屋：{W}×{H}（仮）",font=font(24,True),fill='#28543E')
    d.text((left,sy+H+89),'上側の通路は両案とも通し、右奥から左奥へ移動する構想。',font=font(21),fill='#63746D')
    d.text((left,sy+H+119),'※ 実ゲームの通行・写真鑑賞機能はまだ未実装です。',font=font(19),fill='#7D887F')
for i,(key,c) in enumerate(CONFIG.items()):
    box(154+i*926,key,c,IMGS[key])
sheet.save(OUT/'gallery1_wide_AB_comparison_v01.png',optimize=True)

# For mobile viewport comparison, show a logical-window-width=320px snapshot at 3 stations.
stations={'right_entry':W-320,'center':(W-320)//2,'left_exit':0}
for k,img in IMGS.items():
    canvas=Image.new('RGB',(3*320,582),'#F4F5F1')
    for i,(label,x) in enumerate(stations.items()):
        canvas.paste(img.crop((x,0,x+320,H)).convert('RGB'),(320*i,0))
    canvas.save(OUT/f'gallery1_wide_{k}_viewport_sequence_v01.png',optimize=True)

# Labelled side-by-side 'first-view > move > leave' crops for a phone-size viewport.
walk=Image.new('RGB',(1150,1750),'#F2F5F0')
dw=ImageDraw.Draw(walk)
dw.rounded_rectangle((27,18,1123,124),radius=19,fill='#224538')
dw.text((57,39),'展示室1｜横移動で変わる景色',font=font(36,True),fill='#FFFFFF')
dw.text((57,94),'320px幅の仮表示範囲を、右→中央→左の順番で比較',font=font(20),fill='#D8E8DE')
labels=('入口側（右奥）','中央付近','出口側（左奥）')
for row,(k,c) in enumerate(CONFIG.items()):
    y=152+row*782
    dw.rounded_rectangle((30,y,1120,y+748),radius=15,fill='#FFFFFF',outline='#CDDBCF',width=3)
    dw.text((57,y+15),c['shortLabel'],font=font(28,True),fill='#2C624A')
    for i,(label,x0) in enumerate(zip(labels,stations.values())):
        px=50+i*355
        dw.text((px,y+61),label,font=font(20,True),fill='#557367')
        thumb=IMGS[k].crop((x0,0,x0+320,H)).convert('RGB')
        # Keep the true 320-pixel landscape viewport geometry.
        walk.paste(thumb,(px,y+94))
walk.save(OUT/'gallery1_wide_AB_scroll_view_comparison_v01.png',optimize=True)

manifest={
  'status':'visual comparison, unapproved and unimplemented',
  'base':'user approved entrance Lv1 color/material only; game-room architecture is a new collage',
  'styleSourcePaths':[str(BG_PATH.relative_to(OUT.parents[1])).replace('\\','/'),
                      str(PANEL_PATH.relative_to(OUT.parents[1])).replace('\\','/'),
                      str(COUNTER_PATH.relative_to(OUT.parents[1])).replace('\\','/')],
  'logicalCanvas':[W,H],'camera':'existing mobile horizontal scroll behavior requires actual engineering validation',
  'rearFrames':REAR,'entrance':ENTRANCE,'exit':EXIT,
  'variants':{key:{**c,'spritesUsed':[ 'official background','official right partition',
      'approved reception oak crop' if c['facility'] is not None else 'no other furniture']}
      for key,c in CONFIG.items()},
  'allLiveFixturesUnmodified':True,'savedSchemaUnmodified':True
}
(OUT/'gallery1_wide_AB_manifest_v01.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf8')
assert all(img.size==(W,H) for img in IMGS.values())
assert ImageChops.difference(IMGS['A_wall_6frames'].convert('RGB'),IMGS['B_feature_5frames'].convert('RGB')).getbbox()
assert manifest['variants']['A_wall_6frames']['frameCount']==6
assert manifest['variants']['B_feature_5frames']['frameCount']==5
print('PASS: gallery wide A/B size',W,H)
print('ARTIFACTS',*(p.name for p in OUT.glob('gallery1_wide_*v01.*')),sep='\n')
