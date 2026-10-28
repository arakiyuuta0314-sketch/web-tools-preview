"""B Gallery1 v03: visible west perimeter wall and east wall interrupted by entry.

Independent side-wall overlay is layered over unchanged approved v02 concept.
Not a live game implementation, not a structural collision map.
"""
from PIL import Image,ImageDraw,ImageFont,ImageChops
from pathlib import Path
import math,json
HERE=Path(__file__).resolve().parent
old=Image.open(HERE/'gallery1_B_north_to_gallery3_v02.png').convert('RGBA')
assert old.size==(930,582)
W,H=old.size
FONT=r'C:\Windows\Fonts\meiryo.ttc'
FONTB=r'C:\Windows\Fonts\meiryob.ttc'
def f(n,b=False):return ImageFont.truetype(FONTB if b else FONT,n)
SIDE_WIDTH=42
OPEN_TOP=226
OPEN_BOTTOM=313
# Avoid placing wall over right side entry; render only 219:225 & 314:582.
overlay=Image.new('RGBA',(W,H),(0,0,0,0))
d=ImageDraw.Draw(overlay)
colors={
'outer':'#2A1D14',
'wood_dark':'#432819',
'wood_mid':'#7F502B',
'wood_high':'#BB8D52',
'green':'#174137',
'green_high':'#205148',
'groove':'#39291D'}
def wall_segment(edge,y0,y1):
    x0=0 if edge=='west' else W-SIDE_WIDTH
    x1=x0+SIDE_WIDTH-1
    # A solid bounded wall with a shallow lateral visible surface, perspective-like
    # interior side nearest the room. Wood/green resembles approved entrance stone/teal/oak.
    d.rectangle((x0,y0,x1,y1),fill=colors['wood_dark'])
    d.rectangle((x0+6,y0+4,x1-7,y1-4),fill=colors['green'])
    for yy in range(y0+20,y1,90):
        end=min(y1-7,yy+60)
        if end<=yy:continue
        d.rectangle((x0+10,yy,x1-11,end),fill=colors['green_high'],outline=colors['wood_mid'],width=2)
        d.line((x0+14,yy+2,x1-15,yy+2),fill='#417569',width=1)
    # Long raised wood molding is aligned with the depth direction.
    if edge=='west':
        d.polygon([(x0,y0),(x0+11,y0),(x0+11,y1),(x0,y1)],fill=colors['outer'])
        d.line((x1-4,y0,x1-4,y1),fill=colors['wood_high'],width=3)
        d.line((x1-1,y0,x1-1,y1),fill=colors['outer'],width=2)
    else:
        d.polygon([(x1-11,y0),(x1,y0),(x1,y1),(x1-11,y1)],fill=colors['outer'])
        d.line((x0+4,y0,x0+4,y1),fill=colors['wood_high'],width=3)
        d.line((x0+1,y0,x0+1,y1),fill=colors['outer'],width=2)
    # Side wall foot shadow is cast on the inner floor, restrained to avoid false obstacles.
    inner=x1 if edge=='west' else x0
    if edge=='west':
        d.polygon([(inner,y0+3),(inner+9,y0+8),(inner+9,y1),(inner,y1)],fill=(37,29,19,55))
    else:
        d.polygon([(inner,y0+4),(inner-9,y0+8),(inner-9,y1),(inner,y1)],fill=(37,29,19,55))
def threshold(y):
    # Door cut lines and side jambs, ensuring wall looks interrupted.
    x=W-SIDE_WIDTH
    d.rectangle((x,OPEN_TOP,x+SIDE_WIDTH-1,OPEN_BOTTOM),fill=(0,0,0,0))
    # Explicitly clear *only* overlay, preserving underlying green doorway.
    overlay.paste((0,0,0,0),(x,OPEN_TOP,x+SIDE_WIDTH,OPEN_BOTTOM+1))
    d2=ImageDraw.Draw(overlay)
    d2.rectangle((x,OPEN_TOP-9,x+SIDE_WIDTH-1,OPEN_TOP-1),fill='#382619')
    d2.line((x+5,OPEN_TOP,x+5,OPEN_BOTTOM),fill='#A57442',width=3)
    d2.line((x+SIDE_WIDTH-4,OPEN_TOP,x+SIDE_WIDTH-4,OPEN_BOTTOM),fill='#39271A',width=3)
    d2.rectangle((x,OPEN_BOTTOM+1,x+SIDE_WIDTH-1,OPEN_BOTTOM+12),fill='#4C301F')
    d2.line((x,OPEN_BOTTOM+1,x+SIDE_WIDTH-1,OPEN_BOTTOM+1),fill='#CDA471',width=3)
wall_segment('west',219,581)
d.rectangle((W-SIDE_WIDTH,219,W-1,OPEN_TOP-1),fill=colors['wood_dark'])
wall_segment('east',OPEN_BOTTOM+1,581)
threshold(OPEN_TOP)
# Make a genuine alpha overlay available for other galleries.
overlay.save(HERE/'gallery1_B_side_walls_layer_v03.png',optimize=True)
updated=Image.alpha_composite(old,overlay).convert('RGB')
updated.save(HERE/'gallery1_B_west_east_walls_v03.png',optimize=True)
# Variant with visual highlights around wall boundaries, labels outside the main art
comparison=Image.new('RGB',(1100,1550),'#F5F6F2')
c=ImageDraw.Draw(comparison)
c.rounded_rectangle((24,20,1076,116),radius=18,fill='#264737')
c.text((48,39),'展示室1｜左右の壁を追加',font=f(36,True),fill='#FFFFFF')
c.text((50,88),'同じB案、壁の有無だけを比較',font=f(20),fill='#D8E6DC')
for y,label,im in [
(133,'従来：左右が開放されたように見える',old.convert('RGB')),
(872,'修正：西壁を閉じ、東壁を入口部分だけ開ける',updated)]:
    c.rounded_rectangle((28,y,1072,y+691),radius=18,fill='#FFFFFF',outline='#CED7CB',width=2)
    c.text((52,y+15),label,font=f(26,True),fill='#2C5D43')
    comparison.paste(im,((1100-930)//2,y+65))
comparison.save(HERE/'gallery1_B_side_wall_before_after_v03.png',optimize=True)
# A plain annotated plan with colored markers positioned outside the art canvas.
annot=updated.copy()
dd=ImageDraw.Draw(annot)
# Only a few direction labels, no invented connections.
dd.text((58,244),'西側：壁',fill='#245B48',font=f(18,True),stroke_width=2,stroke_fill='#F1E9D7')
dd.text((713,250),'エントランス',fill='#245B48',font=f(17,True),stroke_width=2,stroke_fill='#F1E9D7')
annot.save(HERE/'gallery1_B_side_wall_annotation_v03.png',optimize=True)
cfg={
 'status':'concept only, unapproved',
 'roomSize':[W,H], 'roomName':'展示室1',
 'westWall':{'side':'west','rect':[0,219,SIDE_WIDTH,582],'openings':[]},
 'eastWall':{'side':'east','segments':[[W-SIDE_WIDTH,219,W,OPEN_TOP],[W-SIDE_WIDTH,OPEN_BOTTOM+1,W,H]],
             'entranceOpening':{'edge':'east','fromY':OPEN_TOP,'toY':OPEN_BOTTOM,'connectsTo':'エントランス'}},
 'northExit':{'destination':'展示室3','visual':'unchanged v02 top arch'},
 'frames':5,
 'facility':'unchanged v02 title stand',
 'independentWalls':2,
 'baseImage':'gallery1_B_north_to_gallery3_v02.png',
 'separateOverlay':'gallery1_B_side_walls_layer_v03.png',
 'note':'East side wall is rendered around the doorway; no collision/path/camera implementation yet.'
}
(HERE/'gallery1_B_side_wall_manifest_v03.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf8')
assert updated.size==old.size==(930,582)
assert ImageChops.difference(updated,old.convert('RGB')).getbbox()
print('PASS v03 sidewall PNGs and manifest; sizes 930x582')
for p in HERE.glob('gallery1_B_*_v03.*'):print(p.name,p.stat().st_size)
