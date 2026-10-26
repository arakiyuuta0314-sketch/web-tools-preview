"""Stage an entirely newly rendered entrance architecture image. Never alter v09/v10 assets."""
from PIL import Image
from pathlib import Path
from hashlib import sha256
import json,shutil
root=Path(__file__).resolve().parent
drive=Path("G:/マイドライブ/A18_entrance_redraw_candidate.png")
if not drive.is_file():raise FileNotFoundError("Drive image source not synced: "+str(drive))
source=root/"art-sources/entrance_clean_redraw_master_20261027.png"
source.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile(drive,source)
im=Image.open(source).convert("RGB")
if im.size!=(1334,1179):raise ValueError(("unexpected original image dims",im.size))
dest=root/"layout-test/assets/entrance/v11"
dest.mkdir(parents=True,exist_ok=True)
target=dest/"entrance_clean_redraw_546x483.png"
im.resize((546,483),Image.Resampling.LANCZOS).save(target,optimize=True)
fingerprint=lambda p:sha256(p.read_bytes()).hexdigest()
manifest={"status":"draft_only_not_main_not_released","source_kind":"full_scene_new_image_generation_not_old_v09_patch","canvas":[546,483],"source_file":str(source.relative_to(root)).replace("\\","/"),"source_sha256":fingerprint(source),"game_file":str(target.relative_to(root)).replace("\\","/"),"game_sha256":fingerprint(target),"source_resolution":[1334,1179],"open_issues":["central door sconce remains painted","old foreground homography must be refit","portrait frame may exceed wall green panel"],"approved":False}
(dest/"source_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(manifest,ensure_ascii=False,indent=2))
