"""QA for B north-passage *concept art*. Not a gameplay collision test."""
from pathlib import Path
from collections import deque
from PIL import Image, ImageChops
import json, math
ROOT=Path(__file__).resolve().parent
m=json.loads((ROOT/'gallery1_B_north_manifest_v02.json').read_text(encoding='utf8'))
assert m['logicalSize']==[930,582]
assert m['roomIdUnchanged']==1 and m['gallery3InternalId']==3
assert m['incomingFromEntrance']['edge']=='right'
assert m['outgoingToGallery3']['edge']=='north'
assert m['oldWestExitRemoved']
assert m['frameCount']==len(m['wallFrames'])+len(m['freestandingFrames'])==5
door=m['outgoingToGallery3']['doorSpriteBounds']
doorRect=(door[0],door[1],door[0]+door[2],door[1]+door[3])
for i,(x,y,w,h) in enumerate(m['wallFrames'],1):
    assert not (x<doorRect[2]+10 and x+w>doorRect[0]-10),(i,'frame overlays exit')
    assert 0<x and x+w<930
for p in ROOT.glob('gallery1_B_north_*_v02.png'):
    with Image.open(p) as img:img.verify()
new=Image.open(ROOT/'gallery1_B_north_to_gallery3_v02.png').convert('RGB')
old=Image.open(ROOT/'gallery1_wide_B_feature_5frames_v01.png').convert('RGB')
assert new.size==old.size==(930,582)
assert ImageChops.difference(new,old).getbbox()
# A synthetic footprint test for a human-scale path. The official collision model is unchanged.
w,h=930,582
solids=[(x+8,y+height-30,x+width-8,y+height+8)
        for x,y,width,height,_,_ in [(142,301,240,182,4,True),(635,322,240,182,5,False)]]
solids.append((407,359+96-17,596,359+96+8))
def free(x,y):
    if not (13<=x<=917 and 222<=y<=565):return False
    return all(not (r[0]-8<=x<=r[2]+8 and r[1]-8<=y<=r[3]+8) for r in solids)
s=6
def snap(p):
    x,y=p
    cand=[(xx,yy) for xx in range(max(12,round(x/s)-3)*s,min(round(w/s)-2,round(x/s)+4)*s,s)
           for yy in range(max(0,round(y/s)-3)*s,min(round(h/s)-2,round(y/s)+4)*s,s)
           if free(xx,yy)]
    assert cand,(p,'no nearby walkable point')
    return min(cand,key=lambda t:math.dist(t,p))
start=snap((899,266))
q=deque([start]);seen={start:0}
while q:
    x,y=q.popleft()
    for v in ((x-s,y),(x+s,y),(x,y-s),(x,y+s)):
        if v not in seen and free(*v):
            seen[v]=seen[(x,y)]+s;q.append(v)
targets={'northGallery3':(349,228),'frame1':(129,242),
        'frame2':(564,241),'frame3':(806,241),
        'frame4':(262,516),'frame5':(755,536),
        'titlePedestal':(499,487)}
for name,point in targets.items():
    dest=snap(point)
    assert dest in seen,(name,point,'unreachable')
    print(name,seen[dest])
# Center-to-north is physically continuous under the hypothetical stand footprints.
assert all(free(x,264) for x in range(350,899,6))
assert all(free(348,y) for y in range(228,265,6))
print('PASS concept north exit/5 frames/feature/reachability and PNG verification')
