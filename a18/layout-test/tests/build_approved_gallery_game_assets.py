"""Convert approved 930x582 artwork to native game 589x482 preserving wall art aspect.

Top architecture (0..350 px) uniform scale 589/930, while perspective stone
floor is vertically expanded in a distinct image segment. Exact approved PNGs
are copied alongside the derived output for provenance, never overwritten.
"""
from pathlib import Path
from PIL import Image
import hashlib, json
src=Path(r"C:\Users\User\source\repos\a18-gallery5-material-review\rooms")
dst=Path(r"C:\Users\User\source\repos\web-tools-preview-a18-gallery-display-names-20261028\a18\layout-test\assets\approved-galleries")
dst.mkdir(parents=True,exist_ok=True)
entries={}
scale=589/930
top_src=350
top_dst=round(top_src*scale)
rendered_gallery1=None

def replace_gallery2_north_arch_with_gallery1_door(game, gallery1):
    # Approved room2 wall/floor remain untouched except the former arched
    # north opening. The room1 finished two-leaf timber door is reused at
    # exactly the same native logical art scale.
    assert game.size==(589,482) and gallery1.size==(589,482)
    original=game.copy()
    px=game.load()
    # Reconstruct the room2 wall behind its former wide oval, sampling only
    # the adjacent untouched room2 wall panel. Otherwise remnants of the old
    # gold oval would show through the soft outer edges.
    for y in range(10,141):
        for x in range(419,517):
            px[x,y]=original.getpixel((396+(x-419)%14,y))
    patch=gallery1.crop((181,10,269,140))
    mask=Image.new("L",patch.size,0)
    mm=mask.load()
    for y in range(patch.height):
        for x in range(patch.width):
            edge=min(x,patch.width-1-x,y,patch.height-1-y)
            mm[x,y]=255 if edge>=5 else int(255*max(0,edge/5))
    game.paste(patch,(423,10),mask)

for room in range(1,6):
    path=src/f"gallery{room}"/"background_approved.png"
    raw=path.read_bytes()
    im=Image.open(path).convert('RGB')
    assert im.size==(930,582)
    orig=dst/f"gallery{room}_approved_930x582.png"
    orig.write_bytes(raw)
    top=im.crop((0,0,930,top_src)).resize((589,top_dst),Image.Resampling.LANCZOS)
    floor=im.crop((0,top_src,930,582)).resize((589,482-top_dst),Image.Resampling.LANCZOS)
    game=Image.new("RGB",(589,482))
    game.paste(top,(0,0));game.paste(floor,(0,top_dst))
    if room==2:
        # Gallery2's originally borderless derived image must match the other
        # galleries' square black architectural surrounds; keep the upper-left
        # west side passage open from y=180 to 308.
        from PIL import ImageDraw
        draw=ImageDraw.Draw(game)
        black=(0,0,0)
        draw.rectangle((0,0,27,179),fill=black)
        draw.rectangle((0,309,27,481),fill=black)
        draw.rectangle((561,0,588,481),fill=black)
        draw.rectangle((28,0,560,9),fill=black)
        draw.rectangle((28,465,560,481),fill=black)

    if room==1:
        rendered_gallery1=game.copy()
    if room==2:
        if rendered_gallery1 is None:raise RuntimeError("E_GALLERY1_DOOR_REFERENCE_MISSING")
        replace_gallery2_north_arch_with_gallery1_door(game,rendered_gallery1)

    derived=dst/f"gallery{room}_game_589x482.png"
    game.save(derived,optimize=True)
    entries[str(room)]={"source":str(orig.relative_to(dst.parent.parent)).replace("\\","/"),
          "game":str(derived.relative_to(dst.parent.parent)).replace("\\","/"),
          "sourceSha256":hashlib.sha256(raw).hexdigest(),
          "gameSha256":hashlib.sha256(derived.read_bytes()).hexdigest(),
          "sourceSize":[930,582],"gameSize":[589,482]}
(dst/"approved-gallery-manifest.json").write_text(json.dumps({"schema":"a18-approved-game-art/v1","topSourceY":top_src,"topGameY":top_dst,"galleries":entries},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("APPROVED game images",top_dst,[(k,v["gameSha256"][:10]) for k,v in entries.items()])
# Independent display-wall PNGs remain assets; preserve compositing and depth control.
gallery=Path(r"C:\Users\User\source\repos\a18-gallery5-material-review\rooms")
for room in range(1,6):
    spec=json.loads((gallery/f"gallery{room}"/"room.json").read_text(encoding="utf-8"))
    for obj in spec["objects"]:
        source=Path(r"C:\Users\User\source\repos\a18-gallery5-material-review")/obj["image"]
        if not source.is_file(): raise FileNotFoundError(source)
        dest=dst/f"gallery{room}_{obj['id']}.png"
        dest.write_bytes(source.read_bytes())
def game_y(y):
    return round(y*scale,2) if y<=top_src else round(top_dst+(y-top_src)*(482-top_dst)/(582-top_src),2)
layout={}
for room in range(1,6):
    room_data=json.loads((gallery/f"gallery{room}"/"room.json").read_text(encoding="utf-8"))
    objects=[]
    for o in room_data["objects"]:
        rect=o["rect"]
        original=Image.open(dst/f"gallery{room}_{o['id']}.png")
        objects.append(dict(id=o["id"],file=f"assets/approved-galleries/gallery{room}_{o['id']}.png",
            x=round(rect["x"]*scale,2),y=game_y(rect["y"]),
            w=round(rect["w"]*scale,2),
            h=round(game_y(rect["y"]+rect["h"])-game_y(rect["y"]),2),
            size=list(original.size)))
    layout[str(room)]={"image":f"assets/approved-galleries/gallery{room}_game_589x482.png","objects":objects}
(dst/"game-layout.json").write_text(json.dumps({"schema":"a18-native-gallery-v1","logical":[589,482],"rooms":layout},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("copied wall source sprites; built native 5-room layout metadata")
