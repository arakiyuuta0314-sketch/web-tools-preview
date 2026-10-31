"""A18 room2/room5 approved geometry change provenance and consistency QA.
No change to original approved 930x582 art; compare only derived image regions.
"""
from pathlib import Path
from PIL import Image
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
art=ROOT/"assets/approved-galleries"
m=json.loads((art/"approved-gallery-manifest.json").read_text(encoding="utf-8"))
orig=art/"gallery2_approved_930x582.png"
game=art/"gallery2_game_589x482.png"
assert hashlib.sha256(orig.read_bytes()).hexdigest()==m["galleries"]["2"]["sourceSha256"]
assert hashlib.sha256(game.read_bytes()).hexdigest()==m["galleries"]["2"]["gameSha256"]
im=Image.open(game).convert("RGB")
assert im.size==(589,482)
P=im.load()
# Square architectural surround; intentional passage aperture upper left.
for pt in [(0,0),(15,155),(15,345),(587,172),(300,2),(320,473)]:
 assert P[pt]==(0,0,0),("MISSING_GALLERY2_BLACK_FRAME",pt,P[pt])
for pt in [(15,244),(55,238),(291,220)]:
 assert P[pt]!=(0,0,0),("GALLERY2_OPEN_PASSAGE_MASKED",pt,P[pt])
from subprocess import run
import json,shutil
# No change to the original shared approval image file.
source_ref=Path(r"C:\Users\User\source\repos\a18-gallery5-material-review\rooms\gallery2\background_approved.png")
assert hashlib.sha256(source_ref.read_bytes()).hexdigest()==m["galleries"]["2"]["sourceSha256"]
print("PASS approved source unchanged; room2 full square black surround, upper-left side entrance open; manifest hash correct")
