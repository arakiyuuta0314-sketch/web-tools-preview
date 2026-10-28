"""Gallery 1 approved-for-continuation B layout: north-facing future Gallery3 exit.
Only a concept-art draft and reusable structured geometry. No live game code changes.
"""
from pathlib import Path
import json,math
from PIL import Image,ImageDraw,ImageChops
from shared_gallery_art_style_v01 import (
    render_base, draw_north_passage, draw_rear_frames,
    place_exhibition_wall, place_display_feature, font,
)
OUT=Path(__file__).resolve().parent
W,H=930,582
NORTH=(290,34,126,184)
REAR=[(61,81,135,83),(496,81,135,83),(739,81,135,83)]
ISLANDS=[(142,301,240,182,4,True),(635,322,240,182,5,False)]
FEATURE=(399,359,205,96)
EAST=(885,219,930,309)
# 1. Architectural base: four bays, right-hand entry, no left-side doorway.
architecture=render_base(W,H,bays=4,side_openings=('right',))
draw_north_passage(architecture,*NORTH)
architecture.save(OUT/'gallery1_B_north_shared_architecture_v02.png',optimize=True)
# 2. Five frame points and one independent facility. B variant is unchanged in role.
scene=architecture.copy()
draw_rear_frames(scene,REAR)
for x,y,w,h,num,mirror in ISLANDS:
    place_exhibition_wall(scene,x,y,w,h,num,mirror)
place_display_feature(scene,*FEATURE)
SCENE='gallery1_B_north_to_gallery3_v02.png'
scene.save(OUT/SCENE,optimize=True)
# 3. Overlay for route inspection ONLY, not a collision graph.
planned=[(902,269),(857,262),(739,263),(622,263),(520,263),(349,263),(349,216)]
guide=scene.copy();gd=ImageDraw.Draw(guide)
gd.line(planned,fill=(47,163,219,238),width=6,joint='curve')
px,py=planned[-1];angle=math.atan2(py-planned[-2][1],px-planned[-2][0])
gd.polygon([(px,py),(px-18*math.cos(angle-.6),py-18*math.sin(angle-.6)),
            (px-18*math.cos(angle+.6),py-18*math.sin(angle+.6))],fill='#37A2D6')
guide.save(OUT/'gallery1_B_north_to_gallery3_route_v02.png',optimize=True)
# 4. Previous approved direction (B conceptual art), for explicit visual comparison.
prev=Image.open(OUT/'gallery1_wide_B_feature_5frames_v01.png').convert('RGB')
assert prev.size==scene.size
CW,CH=1270,1635
board=Image.new('RGB',(CW,CH),'#F3F5F1'); d=ImageDraw.Draw(board)
d.rounded_rectangle((26,20,CW-26,119),radius=18,fill='#204736')
d.text((54,34),'展示室1｜展示室3へ向かう北側通路',font=font(36,True),fill='white')
d.text((55,85),'B案（展示5枠＋案内台）を維持し、左端出口を上壁へ移す',font=font(20),fill='#DBE8DE')
def panel(y,label,detail,im):
    d.rounded_rectangle((32,y,CW-32,y+718),radius=16,fill='white',outline='#D4DFD7',width=3)
    d.text((68,y+12),label,font=font(28,True),fill='#2C5D43')
    d.text((69,y+53),detail,font=font(20),fill='#587467')
    board.paste(im,((CW-W)//2,y+98))
    return y+98
panel(138,'変更前｜左端の仮出口','左側面へ抜けるため、展示室3への北接続とは一致しない',prev)
panel(885,'変更後｜北側の通路へ','上壁の専用開口へ移動。奥壁3作品を避けた位置に設定',scene.convert('RGB'))
board.save(OUT/'gallery1_B_north_before_after_v02.png',optimize=True)
# 5. At-room-width phone scroll illustrations.
ports={'右側入口':(W-320,0,W,H),
       '中央通路':((W-320)//2,0,(W-320)//2+320,H),
       '左側展示':(0,0,320,H)}
strip=Image.new('RGB',(1090,810),'#F2F5F0')
sd=ImageDraw.Draw(strip)
sd.rounded_rectangle((20,17,1070,112),18,fill='#214A38')
sd.text((49,33),'横スクロール時の見え方（B案）',font=font(34,True),fill='white')
sd.text((49,81),'仮カメラ幅320px・右→中央→左',font=font(18),fill='#D9E4DC')
for i,(key,bounds) in enumerate(ports.items()):
    x=30+i*352;sd.text((x,127),key,font=font(20,True),fill='#436D56')
    strip.paste(scene.crop(bounds).convert('RGB'),(x,159))
strip.save(OUT/'gallery1_B_north_scroll_sequence_v02.png',optimize=True)
manifest={
 'status':'concept draft - gallery3 north exit requested, unimplemented',
 'roomName':'展示室1',
 'roomIdUnchanged':1,
 'gallery3InternalId':3,
 'logicalSize':[W,H],
 'incomingFromEntrance':{'edge':'right','rect':EAST},
 'outgoingToGallery3':{'edge':'north','doorSpriteBounds':NORTH,
    'visualDarkPassageRect':[315,80,391,210],
    'approxApproachPoint':[349,228]},
 'oldWestExitRemoved':True,
 'architecturalBays':4,
 'wallFrames':REAR,
 'freestandingFrames':[{'idLabel':num,'panel':[x,y,w,h]} for x,y,w,h,num,_ in ISLANDS],
 'feature':{'kind':'wood_title_pedestal','bounds':FEATURE},
 'frameCount':5,
 'intendedRoute':planned,
 'qaType':'concept geometry and still-image viewport only, NOT live walking test',
 'confirmedStable': ['art tone from approved entrance Lv1','5 frames','feature candidate','right-side entrance'],
 'changed':['exit edge west->north','rear wall 3->4 architectural bays',
   'three back frame positions to clear north exit'],
}
(OUT/'gallery1_B_north_manifest_v02.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print('SUCCESS',W,H)
for p in OUT.glob('gallery1_B_north_*_v02.*'):print(p.name,p.stat().st_size)
