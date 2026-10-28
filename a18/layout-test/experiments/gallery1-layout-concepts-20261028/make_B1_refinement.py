"""B1 refined geometry studies using genuine P3 walls, plinths and frames; no game mutation."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont, ImageChops
DIR=Path(__file__).resolve().parent
ROOT=DIR.parents[1]
cfg=json.loads((ROOT/'p3-architecture-manifest.json').read_text(encoding='utf8'))
def asset(s):return Image.open(ROOT/s).convert('RGBA')
pieces={x:asset(cfg['galleryRooms']['1'][x]) for x in ('floor','wall','trim','glow','light','panel')}
atlas=asset(cfg['frames']['gold'])
n_door=asset(cfg['doors']['north']['open'])
e_door=asset(cfg['doors']['east']['open'])
FONT=r'C:\Windows\Fonts\meiryo.ttc'
BFONT=r'C:\Windows\Fonts\meiryob.ttc'
def f(s,b=False):return ImageFont.truetype(BFONT if b else FONT,s)

# Component panel extraction is from official P3 589px architecture image.
LEFT=pieces['panel'].crop((0,163,190,370))
RIGHT=pieces['panel'].crop((380,163,540,370))
FRAME=(98,76)

def base(height):
    img=Image.new('RGBA',(589,height),'#D9CAB2')
    for name in ('floor','wall','trim','glow','light'):
        img.alpha_composite(pieces[name])
    if height>482:
        # Repeat lower floor texture to fill new space. Visible seam = prototype limitation.
        floor=pieces['floor']
        extra=height-482
        for off in range(0,extra,100):
            block=floor.crop((0,375,589,375+min(100,extra-off)))
            img.alpha_composite(block,(0,482+off))
    return img

def framed(img,xy,index):
    x,y=xy;w,h=FRAME
    d=ImageDraw.Draw(img)
    d.rectangle((x+1,y+3,x+w+3,y+h+4),fill='#4D3827')
    d.rectangle((x+9,y+9,x+w-9,y+h-9),fill='#BBA487')
    for row in range(3):
        for col in range(3):
            if row==col==1:continue
            patch=atlas.crop((14*col,14*row,14*(col+1),14*(row+1)))
            pw=9 if col in (0,2) else w-18
            ph=9 if row in (0,2) else h-18
            patch=patch.resize((pw,ph),Image.Resampling.NEAREST)
            img.alpha_composite(patch,(x+[0,9,w-9][col],y+[0,9,h-9][row]))
    d.text((x+w/2,y+h/2),str(index),fill='#635545',font=f(19,True),anchor='mm')

configs={
  # axis-aligned local P3 geometry, the entrance and outgoing connection are the B1 approved concept.
  'B1a_balanced':dict(title='B1-a｜左右の展示壁を整理',dims=(589,482),
     left=(95,205),right=(357,218),
     frames=[(137,58),(260,58),(386,58),(135,282),(380,292)],
     entrance=(525,194),outgoing=(23,53),
     route=[(550,245),(532,235),(512,213),(360,213),(260,200),(104,200),(71,181),(59,165)],
     note='現行サイズを維持し、正面の余地を確保。奥の通路はやや狭い。'),
  'B1b_deep':dict(title='B1-b｜奥行き拡張と段差配置',dims=(589,582),
     left=(99,240),right=(349,302),
     frames=[(137,58),(260,58),(386,58),(138,319),(368,377)],
     entrance=(525,194),outgoing=(23,53),
     route=[(552,246),(530,235),(517,209),(343,208),(234,207),(75,207),(59,166)],
     note='奥行き+100px。手前壁への鑑賞余地と回り込む距離を確保する。'),
}
def make(c):
    W,H=c['dims']
    img=base(H)
    img.alpha_composite(LEFT,c['left'])
    img.alpha_composite(RIGHT,c['right'])
    img.alpha_composite(n_door,c['outgoing'])
    img.alpha_composite(e_door,c['entrance'])
    for i,xy in enumerate(c['frames'],1):framed(img,xy,i)
    return img
scenes={k:make(c) for k,c in configs.items()}
for k,img in scenes.items(): img.save(DIR/(k+'.png'))
# Layer path as a separate explanatory image, NOT over original room visuals.
def arrow(d,points,fill,width=7):
    d.line(points,fill=fill,width=width,joint='curve')
    ax,ay=points[-2]; bx,by=points[-1]
    ang=math.atan2(by-ay,bx-ax); l=18
    d.polygon([(bx,by),(bx-l*math.cos(ang-.55),by-l*math.sin(ang-.55)),(bx-l*math.cos(ang+.55),by-l*math.sin(ang+.55))],fill=fill)
def overlay_path(k):
    img=scenes[k].copy()
    d=ImageDraw.Draw(img)
    c=configs[k]
    arrow(d,c['route'],(28,145,198,235),5)
    return img
# A standalone full-scene comparison with notes and cropped 'first sight' illustrations.
SW,SH=1560,2070
s=Image.new('RGB',(SW,SH),'#F4F6F2');d=ImageDraw.Draw(s)
d.rounded_rectangle((32,22,SW-32,146),radius=22,fill='#214634')
d.text((70,40),'展示室1｜B1の仕切り壁・見え方',fill='white',font=f(48,True))
d.text((70,110),'実物P3素材を使った建築配置の再検討（現行型 / 奥行き拡張型）',fill='#D5E9DB',font=f(23))
def row(y,key,subtitle):
    c=configs[key];scene=scenes[key];img=scene.convert('RGB')
    d.rounded_rectangle((32,y,SW-32,y+907),radius=22,fill='#FFFFFF',outline='#D4DCD3',width=3)
    d.text((70,y+21),c['title'],fill='#2A5B41',font=f(37,True))
    d.text((70,y+79),subtitle,fill='#66776A',font=f(22))
    # equal logical-pixel enlargement, align room top-left to x=80.
    scale=1.18
    target=(round(img.width*scale),round(img.height*scale))
    enlarged=img.resize(target,Image.Resampling.NEAREST)
    sx,sy=85,y+139
    s.paste(enlarged,(sx,sy))
    # map of exact intended traversing route, separate from real scene image
    path=overlay_path(key).convert('RGB')
    size=(round(path.width*.58),round(path.height*.58))
    section=path.resize(size,Image.Resampling.NEAREST)
    ax,ay=965,y+206
    d.rounded_rectangle((ax-18,ay-59,ax+size[0]+18,ay+size[1]+28),radius=14,fill='#F0F3F0',outline='#D7DDD6')
    d.text((ax,ay-45),'予定動線（青線）',fill='#376481',font=f(25,True))
    s.paste(section,(ax,ay))
    # first impression crop: right 350 logical px from entrance; no camera simulation claim
    crop=img.crop((235,155,589,420))
    crop=crop.resize((round(354*.90),round(265*.90)),Image.Resampling.NEAREST)
    xx,yy=970,y+611
    d.text((xx,yy-43),'右側入口付近の部分図',fill='#376481',font=f(24,True))
    s.paste(crop,(xx,yy))
    d.text((85,y+824),c['note'],fill='#496451',font=f(24))
    d.text((86,y+866),'※ 検証用の想定通路。歩行判定と写真鑑賞アンカーは未実装。',fill='#708079',font=f(19))
row(164,'B1a_balanced','589 × 482｜現行の部屋サイズの範囲で整える')
row(1103,'B1b_deep','589 × 582｜奥行きを100px広げ、展示壁の前後差を強める')
target=DIR/'gallery1_B1_refinement_comparison.png'
s.save(target,optimize=True)
# Basic dimensional/geometry checks: frames stay in intended face and do not overlap each other or door opening.
for k,c in configs.items():
    w,h=c['dims']
    for i,(x,y) in enumerate(c['frames'],1):
        assert 24<=x and x+FRAME[0]<=w-24 and y+FRAME[1]<h-35,(k,i,'frame outside')
    for x,y in c['route']:
        assert 0<=x<=w and 0<=y<=h,(k,'route outside')
    # Footprint proxy for two independent P3 blocks; actual collision not yet added to game.
    lx,ly=c['left'];rx,ry=c['right']
    assert lx+190+25<rx,(k,'too narrow between panels')
    assert max(ly+207,ry+207)<h-15,(k,'no floor space under panels')
    assert c['frames'][3][0]>=lx+25 and c['frames'][3][0]+98<=lx+180,(k,'left frame outside stand')
    assert c['frames'][4][0]>=rx+15 and c['frames'][4][0]+98<=rx+150,(k,'right frame outside stand')
# Concept proxy: stand 20px in front of the visible bottom edge of the panel.
for k,c in configs.items():
    for side in ('left','right'):
        stand_y=c[side][1]+203+20
        clearance=c['dims'][1]-11-stand_y
        assert clearance>=30,(k,side,'insufficient standing space',clearance)
# Save exact conceptual coordinates, not a change to in-game fixtureIds.
(DIR/'gallery1_B1_refinement_geometry.json').write_text(
    json.dumps({k:{'roomSize':list(c['dims']),
        'eastEntrance':list(c['entrance']),'futureNorthwestExit':list(c['outgoing']),
        'panelPositions':{side:list(c[side]) for side in ('left','right')},
        'frameTopLeft':{'frame-1-'+str(i):list(point) for i,point in enumerate(c['frames'])},
        'standingClearance':{side:c['dims'][1]-11-(c[side][1]+203+20) for side in ('left','right')},
        'suggestedPath':c['route']} for k,c in configs.items()},
        ensure_ascii=False,indent=2),encoding='utf8')
print('PASS: source panels, five frames per room, bounds, intended path, all images saved')
for k in ['B1a_balanced','B1b_deep']:print(k,scenes[k].size,(DIR/(k+'.png')).stat().st_size)
print('COMPARE',target, target.stat().st_size)
