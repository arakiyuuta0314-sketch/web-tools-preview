from pathlib import Path
import json
from PIL import Image,ImageChops
P=Path(__file__).resolve().parent
m=json.loads((P/'gallery1_B_side_wall_manifest_v03.json').read_text(encoding='utf8'))
old=Image.open(P/m['baseImage']).convert('RGBA')
wall=Image.open(P/m['separateOverlay']).convert('RGBA')
new=Image.open(P/'gallery1_B_west_east_walls_v03.png').convert('RGB')
assert old.size==wall.size==new.size==(930,582)
assert ImageChops.difference(Image.alpha_composite(old,wall).convert('RGB'),new).getbbox() is None
assert m['westWall']['openings']==[]
assert m['eastWall']['entranceOpening']['edge']=='east'
assert m['northExit']['destination']=='展示室3'
assert m['frames']==5 and m['independentWalls']==2
assert all(wall.getpixel((x,y))[3]==0 for x in (890,910,928) for y in (230,270,308)), 'entrance occluded'
assert wall.getpixel((18,350))[3]>0 and wall.getpixel((906,350))[3]>0
assert wall.getpixel((400,350))[3]==0
assert all(wall.getpixel((x,y))[3]==0 for x in range(0,930,31) for y in (20,100,207)), 'back frames overwritten'
assert ImageChops.difference(old.crop((55,0,875,582)).convert('RGB'),new.crop((55,0,875,582))).getbbox() is None,'interior changed'
for f in P.glob('gallery1_B_*_v03.png'):
 with Image.open(f) as im:im.verify()
print('PASS west closed, east gap preserved, north exit and five displays unchanged; independent side-wall layer')
