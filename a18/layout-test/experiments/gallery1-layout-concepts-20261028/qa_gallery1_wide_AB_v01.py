"""Geometry concept checks only. Actual A18 walking/collision/camera NOT validated."""
from pathlib import Path
from collections import deque
import json,math
from PIL import Image,ImageChops
OUT=Path(__file__).resolve().parent
m=json.loads((OUT/'gallery1_wide_AB_manifest_v01.json').read_text(encoding='utf8'))
w,h=m['logicalCanvas']
assert (w,h)==(930,582)
assert m['entrance']['edge']=='right'
assert m['exit']['edge']=='left'
assert m['entrance']['spanY']==m['exit']['spanY']
assert len(m['rearFrames'])==3
back=Image.open(OUT/'gallery1_wide_shared_architecture_v01.png').convert('RGB')
images={}
for name,c in m['variants'].items():
    img=Image.open(OUT/f'gallery1_wide_{name}_v01.png').convert('RGB')
    images[name]=img
    assert img.size==back.size==(w,h)
    assert c['frameCount']==3+len(c['freestanding'])
    assert len(c['freestanding'])==2+(name=='A_wall_6frames')
    assert (c['facility'] is not None)==(name=='B_feature_5frames')
    # All independent exhibition stand pictures fit their visible wall panels.
    for x,y,ww,hh,index,mirror in c['freestanding']:
        assert 0<=x<x+ww<w and 219<=y<y+hh<h
        assert (hh>=170 and ww>=230)
    # A simple approximate *footprint*, used only to screen for dead-end routes.
    solids=[(x+12,y+hh-30,x+ww-12,y+hh+7) for x,y,ww,hh,*_ in c['freestanding']]
    if c['facility'] is not None:
        x,y,ww,hh=c['facility']
        solids.append((x+8,y+hh-17,x+ww-8,y+hh+6))
    def free(x,y):
        if not (12<x<w-12 and 224<y<h-14):return False
        return all(not (x1-8<=x<=x2+8 and y1-8<=y<=y2+8) for x1,y1,x2,y2 in solids)
    step=6
    frompos=(888,258)
    def near(x,y):
        positions=[(xx,yy) for xx in range(max(0,round(x/step)-3)*step,min(w,round(x/step)+4)*step,step)
            for yy in range(max(0,round(y/step)-3)*step,min(h,round(y/step)+4)*step,step) if free(xx,yy)]
        return min(positions,key=lambda z:math.dist(z,(x,y)))
    seed=near(*frompos)
    q=deque([seed]);paths={seed:0}
    while q:
        x,y=q.popleft()
        for pt in [(x+step,y),(x-step,y),(x,y+step),(x,y-step)]:
            if pt not in paths and free(*pt):
                paths[pt]=paths[(x,y)]+step
                q.append(pt)
    targets={'left_exterior':(42,258)}
    for i,(x,_,ww,hh) in enumerate(m['rearFrames'],1):
        targets[f'rear{i}']=(x+ww/2,236)
    for x,y,ww,hh,i,_ in c['freestanding']:
        targets[f'island{i}']=(x+ww/2,min(h-24,y+hh+20))
    if c['facility'] is not None:
        x,y,ww,hh=c['facility'];targets['feature']=(x+ww/2,y+hh+26)
    reachable={name:near(*p) in paths for name,p in targets.items()}
    assert all(reachable.values()),(name,reachable)
    # Upper corridor must be uninterrupted in THIS concept, not real game.
    assert all(free(x,258) for x in range(48,883,6)),f'{name}: upper lane blocked'
    print('PASS',name,'tested targets',len(reachable),'max suggested walk px',max(paths[near(*pt)] for pt in targets.values()))
assert ImageChops.difference(images['A_wall_6frames'],images['B_feature_5frames']).getbbox()
for p in OUT.glob('gallery1_wide_*.png'):
    with Image.open(p) as test:test.verify()
print('PASS images / fixed entrance-exit / 3 rear artworks / independent walls / prototype reachability')
