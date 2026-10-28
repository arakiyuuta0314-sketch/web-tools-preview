"""Concept reachability proxy. NOT an engine collision or playtest result."""
from pathlib import Path
import json, math, collections
DIR=Path(__file__).resolve().parent
data=json.loads((DIR/'gallery1_B1_refinement_geometry.json').read_text(encoding='utf8'))
results={}
step=4
for name,c in data.items():
    w,h=c['roomSize'];p=c['panelPositions']
    # Placeholder solid: the P3 plinth base footprint rather than the whole visible image.
    obstacles=[(x+8,y+180,x+(180 if side=='left' else 151),y+206) for side,(x,y) in p.items()]
    def inside(x,y):
        if x<24 or x>w-24 or y<165 or y>h-16:return False
        for x1,y1,x2,y2 in obstacles:
            if x1-10<=x<=x2+10 and y1-10<=y<=y2+10:return False
        return True
    start=(552,242)
    assert inside(*start),(name,'entry blocked')
    def snap(point):
        x,y=point
        cand=[(i*step,j*step) for i in range(max(0,x//step-5),min(w//step+1,x//step+6))
              for j in range(max(0,y//step-5),min(h//step+1,y//step+6))
              if inside(i*step,j*step)]
        return min(cand,key=lambda q:math.dist(q,point))
    start=snap(start)
    q=collections.deque([start])
    dist={start:0}
    while q:
        x,y=q.popleft()
        for pnt in ((x-step,y),(x+step,y),(x,y-step),(x,y+step)):
            if pnt not in dist and inside(*pnt):
                dist[pnt]=dist[(x,y)]+step
                q.append(pnt)
    points={
      'futureLeftExit':(66,183),
      'wallArtwork1':(186,184),
      'wallArtwork2':(309,184),
      'wallArtwork3':(435,184),
      'floorArtwork4':(p['left'][0]+85,p['left'][1]+228),
      'floorArtwork5':(p['right'][0]+80,p['right'][1]+228)
    }
    evaluated={label:{'position':list(loc),'approxPathLengthPx':dist.get(snap(loc),None),
        'reachable':snap(loc) in dist,'targetDistanceToWalkable':round(math.dist(loc,snap(loc)),1)}
        for label,loc in points.items()}
    assert all(x['reachable'] for x in evaluated.values()),(name,evaluated)
    results[name]={'test':'approximate grid, concept solids only, not engine','targets':evaluated}
    print('PASS',name,'targets',len(evaluated),
          'largest_walk_length',max(v['approxPathLengthPx'] for v in evaluated.values()))
(DIR/'gallery1_B1_refinement_reachability_qa.json').write_text(
 json.dumps(results,indent=2,ensure_ascii=False),encoding='utf8')
