"""Rebuild approved entrance background from the user-approved immutable PNG, never an older draft."""
from pathlib import Path
from PIL import Image
from hashlib import sha256
import json
root=Path(__file__).resolve().parent
source=root/"art-sources/entrance_clean_redraw_master_20261027.png"
expected="fc49d29a1dd108c4b23f37624ada25232be6234f763b7039a49e3e3c113b618c"
digest=lambda p:sha256(p.read_bytes()).hexdigest()
if digest(source)!=expected:raise ValueError("E_APPROVED_A18_ASSET_HASH_MISMATCH")
im=Image.open(source).convert("RGB")
if im.size!=(1334,1179):raise ValueError("E_APPROVED_A18_ASSET_SIZE")
dest=root/"layout-test/assets/entrance/v11"
dest.mkdir(parents=True,exist_ok=True)
target=dest/"entrance_clean_redraw_546x483.png"
im.resize((546,483),Image.Resampling.LANCZOS).save(target,optimize=True)
manifest={"status":"approved_image_pending_game_QA","source_kind":"user_approved_image_generated_20261027","source_file":source.relative_to(root).as_posix(),"source_sha256":expected,"source_resolution":list(im.size),"canvas":[546,483],"game_file":target.relative_to(root).as_posix(),"game_sha256":digest(target),"old_draft_sha_is_rejected":True,"approved_image":True,"browser_qa":"pending"}
(dest/"source_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("APPROVED_ORIGINAL",expected,"RESIZED",digest(target))
