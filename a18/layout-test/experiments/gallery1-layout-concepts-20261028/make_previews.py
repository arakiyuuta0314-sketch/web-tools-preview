from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json
DIR=Path(__file__).resolve().parent
ROOT=DIR.parents[1]
m=json.loads((ROOT/'p3-architecture-manifest.json').read_text(encoding='utf-8'))
def load(rel):return Image.open(ROOT/rel).convert('RGBA')
asset={k:load(m['galleryRooms']['1'][k]) for k in ['floor','wall','panel','trim','glow','light']}
atlas=load(m['frames']['gold'])
north=load(m['doors']['north']['open'])
east=load(m['doors']['east']['open'])
F=lambda n,b=False:ImageFont.truetype(r'C:\Windows\Fonts\meiryob.ttc' if b else r'C:\Windows\Fonts\meiryo.ttc',n)
def scene(w=589,panels=True):
    x=Image.new('RGBA',(w,482),'#D6CDB8')
    for off in range(0,w,589):
        span=min(589,w-off)
        for name in ['floor','wall','trim','glow','light']:
            x.alpha_composite(asset[name].crop((0,0,span,482)),(off,0))
    if panels:x.alpha_composite(asset['panel'])
    return x
def frame(x,px,py,i):
    w,h=98,76
    d=ImageDraw.Draw(x)
    d.rectangle((px+2,py+3,px+w+2,py+h+3),fill='#372D23')
    d.rectangle((px+9,py+9,px+w-9,py+h-9),fill='#B5A184')
    for yy in range(3):
        for xx in range(3):
            if xx==yy==1:continue
            s=14;b=9
            tile=atlas.crop((xx*s,yy*s,(xx+1)*s,(yy+1)*s))
            tile=tile.resize((b if xx!=1 else w-2*b,b if yy!=1 else h-2*b),Image.Resampling.NEAREST)
            dx=[px,px+b,px+w-b][xx];dy=[py,py+b,py+h-b][yy]
            x.alpha_composite(tile,(dx,dy))
    d.text((px+w/2,py+h/2),str(i),font=F(20,True),fill='#685C4B',anchor='mm')
a=scene()
a.alpha_composite(north,(329,53))
a.alpha_composite(east,(525,326))
for i,xy in enumerate([(42,58),(208,58),(418,58),(56,251),(405,251)],1):frame(a,*xy,i)
# B: existing side walls moved inward and staggered, shift the exit door into the right part of back wall.
b=scene(panels=False)
left=asset['panel'].crop((0,163,190,370))
right=asset['panel'].crop((380,163,540,370))
b.alpha_composite(left,(110,190))
b.alpha_composite(right,(365,229))
b.alpha_composite(north,(480,53))
b.alpha_composite(east,(525,326))
for i,xy in enumerate([(35,58),(190,58),(350,58),(151,262),(389,305)],1):frame(b,*xy,i)
# C: long horizontal gallery; no floor-standing walls, murals aligned along uninterrupted long rear wall.
c=scene(1000,panels=False)
c.alpha_composite(north,(55,53))
c.alpha_composite(east,(936,326))
for i,x in enumerate((175,345,515,685,855),1):frame(c,x,58,i)
for name,img in [('A',a),('B',b),('C',c)]:
    img.save(DIR/f'gallery1_{name}.png')
# 3-option composition sheet
W,H=1250,1980
sheet=Image.new('RGB',(W,H),'#F4F5F1')
d=ImageDraw.Draw(sheet)
d.rounded_rectangle((24,22,W-24,136),radius=22,fill='#274739')
d.text((60,44),'展示室1｜建築レイアウト 3案',font=F(39,True),fill='white')
d.text((61,99),'実際のP3美術素材を再利用した監修用試作（ゲーム実装ではありません）',font=F(20),fill='#D6E3DB')
def row(y,name,title,sub,img):
    d.rounded_rectangle((30,y,W-30,y+574),radius=18,fill='white',outline='#D0D7D0',width=3)
    d.text((62,y+18),f'{name}  {title}',font=F(33,True),fill='#295C43')
    d.text((63,y+68),sub,font=F(21),fill='#5E7166')
    scale=min(1130/img.width,456/img.height)
    size=(round(img.width*scale),round(img.height*scale))
    view=img.resize(size,Image.Resampling.NEAREST).convert('RGB')
    sheet.paste(view,((W-size[0])//2,y+108))
row(160,'A','現行型｜奥3＋手前2','正式な壁・額縁・ドアの位置を維持した比較基準',a)
row(760,'B','回り込み型｜仕切り壁を前後に配置','奥までまっすぐ見通せない。壁と奥扉の位置は仮配置。',b)
row(1360,'C','横長回廊型｜壁沿いに5作品','部屋幅1000pxの全景表示。実プレイでは横スクロールが必要。',c)
sheet.save(DIR/'gallery1_ABC_comparison.png')
assert all((DIR/f'gallery1_{name}.png').is_file() for name in ['A','B','C'])
print('PASS',*[f'{name}:{img.size}' for name,img in [('A',a),('B',b),('C',c)]])
print(DIR/'gallery1_ABC_comparison.png')
