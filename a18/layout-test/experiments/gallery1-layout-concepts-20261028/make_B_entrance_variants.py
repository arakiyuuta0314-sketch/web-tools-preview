"""B layout entrance comparison from source P3 layers. Concept only."""
import importlib.util
import sys
sys.dont_write_bytecode=True
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
DIR=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('base_gallery',DIR/'make_previews.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
F=mod.F
# reuse original room background, shared architecture, authentic door & 9-slice frame.
def build(entrance_y):
    scene=mod.scene(panels=False)
    left=mod.asset['panel'].crop((0,163,190,370))
    right=mod.asset['panel'].crop((380,163,540,370))
    # both are shifted below the rear walking lane, preserving the staggered gallery concept
    scene.alpha_composite(left,(110,248))
    scene.alpha_composite(right,(365,229))
    # North passage reserved for future room, moved to top-left side
    scene.alpha_composite(mod.north,(23,53))
    # Entrances at near-rear (planned) versus near-foreground (legacy)
    scene.alpha_composite(mod.east,(525,entrance_y))
    for i,xy in enumerate([(141,58),(265,58),(391,58),(154,322),(392,305)],1):
        mod.frame(scene,*xy,i)
    return scene
variants={
    'B1_planned':build(194),
    'B2_diagonal':build(326),
}
for name,img in variants.items():img.save(DIR/f'gallery1_{name}.png')
# 2-panel annotated mobile-friendly sheet. Arrows show INTENDED travel direction, not verified collision.
W,H=1250,1660
sheet=Image.new('RGB',(W,H),'#F3F5F1')
d=ImageDraw.Draw(sheet)
d.rounded_rectangle((26,22,1224,137),radius=19,fill='#214636')
d.text((58,43),'展示室1｜B型 入り口・通路 2案',font=F(42,True),fill='white')
d.text((60,101),'B型の仕切り壁と5枚展示を維持し、接続の向きを比較',font=F(21),fill='#D8E4DC')
def draw_path(points,fill):
    # annotated only; not pixel-identical to game walkway collision
    d.line(points,fill=fill,width=8,joint='curve')
    import math
    a,b=points[-2:];ang=math.atan2(b[1]-a[1],b[0]-a[0])
    tail=23
    d.polygon([b,(b[0]-tail*math.cos(ang-.55),b[1]-tail*math.sin(ang-.55)),
                   (b[0]-tail*math.cos(ang+.55),b[1]-tail*math.sin(ang+.55))],fill=fill)
def panel(y,key,title,description,detail,incoming):
    d.rounded_rectangle((31,y,1219,y+716),radius=17,fill='white',outline='#CAD6CC',width=3)
    d.text((58,y+16),title,font=F(33,True),fill='#244E38')
    d.text((58,y+70),description,font=F(20),fill='#607365')
    x1,top=224,y+113;scale=1.25
    scene=variants[key].resize((round(589*scale),round(482*scale)),Image.Resampling.NEAREST)
    sheet.paste(scene,(x1,top),scene)
    # paths in overlay only: travel from right edge to upper-left door
    t=lambda x,y:(round(x1+x*scale),round(top+y*scale))
    if incoming=='upper':
        points=[t(575,241),t(554,241),t(550,201),t(320,201),t(83,201),t(59,165)]
    else:
        points=[t(575,384),t(552,384),t(551,204),t(320,204),t(87,204),t(59,165)]
    draw_path(points,'#3E97C5')
    # annotate outside, not on game image
    d.text((75,top+46),'次の展示室へ',font=F(22,True),fill='#306D90')
    d.text((1000,top+188 if incoming=='upper' else top+397),'入口',font=F(26,True),fill='#306D90')
    d.text((76,y+647),detail,font=F(21),fill='#426654')
    d.text((77,y+681),'※ 青線は想定動線。実ゲームの通行・衝突判定ではありません。',font=F(17),fill='#69796E')
panel(164,'B1_planned','B1｜予定入口に合わせる','右奥から入室 → 左奥の出口へ。背後の通路と自然につながる。','入口：右奥 ／ 奥側の出口：左端（後続エリアは仮）','upper')
panel(898,'B2_diagonal','B2｜旧入口を回廊として解釈','右手前から入室 → 右端を北上 → 左奥に抜ける。','入口：右手前 ／ 奥側の出口：左端（後続エリアは仮）','lower')
sheet.save(DIR/'gallery1_B_entrances_comparison.png',optimize=True)
assert all(p.is_file() for p in [DIR/'gallery1_B_entrances_comparison.png',*[DIR/f'gallery1_{k}.png' for k in variants]])
print('CREATED',*(str(p) for p in [DIR/'gallery1_B_entrances_comparison.png',*[DIR/f'gallery1_{k}.png' for k in variants]]),sep='\n')
