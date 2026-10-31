"""Gallery2 north door matches Gallery1, without altering other approved pixels."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json

root=Path(__file__).resolve().parents[1]
art=root/"assets/approved-galleries"
manifest=json.loads((art/"approved-gallery-manifest.json").read_text(encoding="utf-8"))
ref=Image.open(art/"gallery1_game_589x482.png").convert("RGB")
now=Image.open(art/"gallery2_game_589x482.png").convert("RGB")
approved=art/"gallery2_approved_930x582.png"
assert hashlib.sha256(approved.read_bytes()).hexdigest()==manifest["galleries"]["2"]["sourceSha256"]
assert hashlib.sha256((art/"gallery2_game_589x482.png").read_bytes()).hexdigest()==manifest["galleries"]["2"]["gameSha256"]
assert now.size==(589,482)
# Exact timber arch and double-door textures are borrowed from Gallery1.
for x,y in [(200,35),(224,46),(224,65),(207,100),(237,100),(228,113),(224,132)]:
 assert now.getpixel((x+242,y))==ref.getpixel((x,y)),(x,y)
# Independently reconstruct the old gallery2 architectural base using the
# approved 930x582 art. Replacing the north door must not edit any other pixels.
original=Image.open(approved).convert("RGB")
scale=589/930
top_dst=round(350*scale)
before=Image.new("RGB",(589,482))
before.paste(original.crop((0,0,930,350)).resize((589,top_dst),Image.Resampling.LANCZOS),(0,0))
before.paste(original.crop((0,350,930,582)).resize((589,482-top_dst),Image.Resampling.LANCZOS),(0,top_dst))
draw=ImageDraw.Draw(before)
for box in [(0,0,27,179),(0,309,27,481),(561,0,588,481),(28,0,560,9),(28,465,560,481)]:
 draw.rectangle(box,fill=(0,0,0))
changed=0
for y in range(482):
 for x in range(589):
  if before.getpixel((x,y))!=now.getpixel((x,y)):
   changed+=1
   assert 419<=x<517 and 10<=y<=140,("UNRELATED_ART_PIXEL_CHANGED",x,y)
assert changed>6000,("NORTH_DOOR_NOT_REPLACED",changed)
for x,y in [(0,0),(15,155),(15,345),(587,172),(300,2),(320,473)]:
 assert now.getpixel((x,y))==(0,0,0)
for x,y in [(15,244),(55,238),(291,220)]:
 assert now.getpixel((x,y))!=(0,0,0)
print("PASS Gallery2 north double timber door matches Gallery1",changed,"door-only changed pixels")
print("PASS approved source, surrounding wall, Gallery2 west passage and black frame intact")
