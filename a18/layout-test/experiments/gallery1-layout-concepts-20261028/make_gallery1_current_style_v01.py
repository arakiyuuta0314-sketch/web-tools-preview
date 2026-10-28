"""A18 Gallery1 B1b visual concept using only currently approved entrance Lv1 source images.
Standalone preview, not a replacement of game renderer, layout, saved user art, or room IDs.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageEnhance
import json,math
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
ASSET=ROOT/'assets/entrance'
BG=Image.open(ASSET/'approved_initial_20261027/entrance_background_initial_approved.png').convert('RGBA')
RIGHT=Image.open(ASSET/'counter_candidate_20261028/partition_right_lv1_approved_v11.png').convert('RGBA')
LEFT=Image.open(ASSET/'counter_candidate_20261028/partition_left_oak_lv1_approved_v11.png').convert('RGBA')
assert BG.size==(1322,1190) and RIGHT.size==LEFT.size==(860,488)
W,H=589,582
FONT=r'C:\Windows\Fonts\meiryo.ttc'
FONT_B=r'C:\Windows\Fonts\meiryob.ttc'
def ff(n,b=False):return ImageFont.truetype(FONT_B if b else FONT,n)
def fit_crop(img,area,size):
    return img.crop(area).resize(size,Image.Resampling.LANCZOS)
def alpha_rect(draw,box,fill,width=1):
    draw.rectangle(box,outline=fill,width=width)
def framing(img,rect,index):
    # visually restrained identical dark wood / gilded lip as current entrance Lv1
    x,y,w,h=rect
    dr=ImageDraw.Draw(img)
    dr.rectangle((x+2,y+3,x+w+3,y+h+4),fill='#291B11')
    bands=['#312015','#8B572C','#AD7637','#D3A25C','#8E602D','#51321C','#302115']
    for i,color in enumerate(bands):
        dr.rectangle((x+i,y+i,x+w-i,y+h-i),outline=color,width=1)
    dr.rectangle((x+8,y+8,x+w-8,y+h-8),fill='#215247')
    # This neutral placeholder is deliberately not artwork or new decor.
    dr.rectangle((x+10,y+10,x+w-10,y+h-10),fill='#274F43')
    dr.text((x+w/2,y+h/2),str(index),font=ff(20,True),fill='#F0DEAE',anchor='mm')

def build(split=False):
    image=Image.new('RGBA',(W,H))
    # Current approved floor. Cropped from approved entrance base, no old P3.
    floor=fit_crop(BG,(0,515,1322,1190),(W,H-218))
    image.alpha_composite(floor,(0,218))
    # Wooden gallery rear wall: reuse the teal panel, dark oak trim and gold-toned
    # architectural ribs of the *approved* entrance. No old P3 textures.
    panel_crop=(102,8,470,515)
    seg=fit_crop(BG,panel_crop,(195,218))
    for i in range(3):
        image.alpha_composite(seg,(i*196,0))
    # Approved column crop, repeated to divide the three exhibition bays.
    pillar=fit_crop(BG,(512,18,579,515),(32,215))
    for x in (0,190,386,557):
        image.alpha_composite(pillar,(x,0))
    # Approved top cornice source; extend uniformly, seams hidden by pillars.
    cornice=fit_crop(BG,(70,0,465,88),(196,42))
    for i in range(3):image.alpha_composite(cornice,(196*i,0))
    # Wainscot foot line; shaded wood edge makes floor/wall join coherent.
    dr=ImageDraw.Draw(image)
    dr.rectangle((0,207,W,218),fill='#402816')
    dr.line((0,209,W,209),fill='#A46B35',width=2)
    dr.line((0,217,W,217),fill='#1E1612',width=2)
    # Two actual *side opening* recesses, no entrance centerpiece copied.
    # right = entrance from behind entrance Lv1 left partition; left = future exit.
    for which,x in [('left',0),('right',540)]:
        dr.rectangle((x,218,x+49,306),fill='#38271B')
        dr.rectangle((x+5,224,x+44,301),fill='#102B27')
        # subdued bright floor at the passage threshold
        dr.polygon([(x+8,302),(x+38,302),(x+45,310),(x+2,310)],fill='#CDAF85')
        dr.line((x+4,226,x+4,307),fill='#A5753A',width=3)
        dr.line((x+44,226,x+44,307),fill='#946132',width=3)
    # Three pictures on green back wall. Occupy separate architectural bays.
    for i,(x,y) in enumerate([(49,83),(245,83),(427,83)],1):
        framing(image,(x,y,105,69),i)
    # Freestanding walls at distinct depths. Same *approved* right-side panel,
    # mirror the left panel so both lateral faces point into the room.
    # Soft plinth shadow: makes depth legible without decorative furnishings.
    # The approved wall PNG already has its own foot shadow: avoid a second oval shadow.
    # Both use approved teak/teal independent panel sprite, not old P3 beige structures.
    left_wall=RIGHT.transpose(Image.Transpose.FLIP_LEFT_RIGHT).resize((199,150),Image.Resampling.LANCZOS)
    right_wall=RIGHT.resize((199,150),Image.Resampling.LANCZOS)
    image.alpha_composite(left_wall,(93,287))
    image.alpha_composite(right_wall,(346,362))
    # Dark wood frames directly on the visible green inset.
    framing(image,(119,325,132,73),4)
    framing(image,(375,405,130,74),5)
    return image

room=build()
room.save(OUT/'gallery1_B1b_current_style_v01.png',optimize=True)
# Blue path, independent layout guide. Keep the clean version pristine.
guide=room.copy()
dr=ImageDraw.Draw(guide)
route=[(560,266),(525,266),(506,257),(330,258),(225,258),(79,258),(38,274)]
dr.line(route,fill=(50,159,216,235),width=5,joint='curve')
angle=math.atan2(route[-1][1]-route[-2][1],route[-1][0]-route[-2][0]);point=route[-1]
dr.polygon([point,
(point[0]-16*math.cos(angle-.55),point[1]-16*math.sin(angle-.55)),
(point[0]-16*math.cos(angle+.55),point[1]-16*math.sin(angle+.55))],fill='#329FD8')
guide.save(OUT/'gallery1_B1b_current_style_route_v01.png',optimize=True)
# Portrait reference and layout for mobile viewing.
S=1400;D=Image.new('RGB',(S,2110),'#F5F6F2');dr=ImageDraw.Draw(D)
dr.rounded_rectangle((33,23,1367,138),radius=19,fill='#223E32')
dr.text((70,39),'展示室1｜現行美術デザイン B1-b',font=ff(44,True),fill='white')
dr.text((72,105),'エントランスLv.1の正式画像を元に再構成した2D監修案',font=ff(22),fill='#D5E3D7')
def room_panel(top,with_route,tag,title,subtitle):
    dr.rounded_rectangle((35,top,1365,top+883),radius=18,fill='white',outline='#D5DDD4',width=3)
    dr.text((70,top+16),tag+'　'+title,font=ff(33,True),fill='#265641')
    dr.text((70,top+68),subtitle,font=ff(21),fill='#67786B')
    scale=1.19
    src=guide if with_route else room
    img=src.resize((round(W*scale),round(H*scale)),Image.Resampling.LANCZOS).convert('RGB')
    x=(S-img.width)//2
    D.paste(img,(x,top+103))
    dr.text((x+7,top+843),'左奥：次室への仮出口',font=ff(19),fill='#496651')
    dr.text((x+img.width-245,top+843),'右奥：エントランスから',font=ff(19),fill='#496651')
room_panel(170,False,'01','装飾なしの見た目','壁・床・展示5枠・入口の位置だけを表示')
room_panel(1110,True,'02','同じレイアウトの動線確認','青線は想定移動方向で、実ゲームの通行判定ではありません')
D.save(OUT/'gallery1_B1b_current_style_overview_v01.png',optimize=True)
# Style contrast against the previous P3 visual at exactly equal room dimensions.
old=Image.open(OUT/'B1b_deep.png').convert('RGB')
assert old.size==room.size
comparison=Image.new('RGB',(990,1540),'#F4F6F2')
cd=ImageDraw.Draw(comparison)
cd.text((40,22),'展示室1｜旧P3案から現行デザインへ',font=ff(34,True),fill='#214B39')
for y,label,img in ((90,'旧：P3淡色デザイン',old),(818,'新：エントランスLv.1参照',room.convert('RGB'))):
    cd.rounded_rectangle((32,y,958,y+700),radius=16,fill='white',outline='#D4DFD7',width=3)
    cd.text((61,y+14),label,font=ff(29,True),fill='#325D48')
    view=img.resize((589,582),Image.Resampling.LANCZOS)
    comparison.paste(view,((990-view.width)//2,y+67))
comparison.save(OUT/'gallery1_B1b_current_style_old_vs_new_v01.png',optimize=True)
config={
 'status':'visual mockup only (unapproved)',
 'sourceBackground':'assets/entrance/approved_initial_20261027/entrance_background_initial_approved.png',
 'sourceIndependentWall':'assets/entrance/counter_candidate_20261028/partition_right_lv1_approved_v11.png',
 'layoutSize':[589,582],
 'room':'展示室1','entrance':'right-rear','futureExit':'left-rear, destination undecided',
 'galleryWallFrames':[(49,83,105,69),(245,83,105,69),(427,83,105,69)],
 'freeStandingWalls':[(93,287,199,150),(346,362,199,150)],
 'freeStandingFrames':[(119,325,132,73),(375,405,130,74)],
 'note':'Pixel preview composites existing official assets; geometry, IDs and collision in real game are unchanged.'
}
(OUT/'gallery1_B1b_current_style_manifest_v01.json').write_text(json.dumps(config,ensure_ascii=False,indent=2),encoding='utf8')
assert room.size==guide.size==(589,582)
assert all((OUT/name).is_file() for name in ('gallery1_B1b_current_style_v01.png','gallery1_B1b_current_style_route_v01.png','gallery1_B1b_current_style_overview_v01.png','gallery1_B1b_current_style_manifest_v01.json'))
print('SUCCESS',json.dumps({p.name:p.stat().st_size for p in OUT.glob('gallery1_B1b_current_style*')},ensure_ascii=False))
