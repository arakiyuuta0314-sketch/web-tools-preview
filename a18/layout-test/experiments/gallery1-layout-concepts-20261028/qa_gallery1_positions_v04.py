"""Screen placement/circulation proxy only: does not replace actual A18 collision test."""
from pathlib import Path
from PIL import Image,ImageChops
from collections import deque
import json,math
D=Path(__file__).resolve().parent
m=json.loads((D/'gallery1_v04_layout_options.json').read_text(encoding='utf-8'))
W,H=m['fixed']['floorSize']
assert [W,H]==[930,582]
boundary=Image.open(D/'gallery1_v04_fixed_architecture.png').convert('RGB')
old=Image.open(D/'gallery1_B_west_east_walls_v03.png').convert('RGB')
results={}
for key,v in m['options'].items():
 im=Image.open(D/f'gallery1_v04_{key}.png').convert('RGB')
 assert im.size==(W,H)
 # Architectural upper corridor, back photos, north arch and side openings have not moved.
 assert ImageChops.difference(im.crop((0,0,W,272)),old.crop((0,0,W,272))).getbbox() is None,key
 assert ImageChops.difference(im.crop((0,0,W,272)),boundary.crop((0,0,W,272))).getbbox() is None,key
 left,right,desk=v['left'],v['right'],v['desk']
 furniture=[left,right,desk]
 # Full objects do not overlap one another, are separated from the side walls.
 for i,(x,y,w,h) in enumerate(furniture):
  assert x>=42 and x+w<=888,(key,i,'side wall interference')
  assert y>=280 and y+h<=H-20,(key,i,'bottom cut')
 for i,a in enumerate(furniture):
  for b in furniture[i+1:]:
   assert not(a[0]<b[0]+b[2] and a[0]+a[2]>b[0] and a[1]<b[1]+b[3] and a[1]+a[3]>b[1]),key
 # Conservative 13px radius around an actor and proxied furniture-foot collision.
 rad=13;step=5
 obstacles=[(x+7,y+h-37,x+w-7,y+h+4) for x,y,w,h in furniture]
 def free(x,y):
  if x<42+rad or x>W-42-rad or y<218+rad or y>H-rad:return False
  return all(not(x1-rad<=x<=x2+rad and y1-rad<=y<=y2+rad) for x1,y1,x2,y2 in obstacles)
 def snap(p):
  x,y=p
  cand=[(xx,yy) for xx in range(max(0,int(x/step)-4)*step,min(W,int(x/step)+5)*step,step)
    for yy in range(max(0,int(y/step)-4)*step,min(H,int(y/step)+5)*step,step) if free(xx,yy)]
  assert cand,(key,'no nearby floor',p)
  return min(cand,key=lambda c:math.dist(c,p))
 start=snap((875,264))
 pending=deque([start]);dist={start:0}
 while pending:
  x,y=pending.popleft()
  for p in ((x-step,y),(x+step,y),(x,y-step),(x,y+step)):
   if p not in dist and free(*p):
    dist[p]=dist[(x,y)]+step
    pending.append(p)
 targets={'northDoor':(349,241),'back1':(129,241),'back2':(563,241),'back3':(806,241)}
 for j,(x,y,w,h) in enumerate(furniture):
  targets[['photo4','photo5','infoDesk'][j]]=(x+w/2,y+h+18)
 distances={}
 for k,p in targets.items():
  near=snap(p)
  assert math.dist(p,near)<=14,(key,k,'excessive target displacement',p,near)
  assert near in dist,(key,k,'unreachable')
  distances[k]=dist[near]
 # Ensure route from entrance to arch through uninterrupted rear strip.
 assert all(free(x,244) for x in range(360,861,step)),(key,'upper right corridor blocked')
 results[key]={'reached':distances,'frontFloorMarginPx':{name:H-(rect[1]+rect[3]+18)
   for name,rect in zip(('left','right','desk'),furniture)},'frameCount':5,
   'scope':'approximate 13px radius static collider proxy; NOT live game QA'}
 print('PASS',key,'min front margin',min(results[key]['frontFloorMarginPx'].values()),
       'max approximate path',max(distances.values()))
assert results['P_stagger']['frontFloorMarginPx']['left']>0
assert results['P_stagger']['frontFloorMarginPx']['right']>0
(D/'gallery1_v04_placement_QA.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
print('PASS north corridor + all 3 back and 2 islands + desk for 3 options')
