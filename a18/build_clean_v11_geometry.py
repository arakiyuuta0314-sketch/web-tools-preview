"""Construct only new drawing placement mask and projective geometry.
No old background pixels reused. The 1334x1179 newly authored image is sole architecture source.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,cv2,json,hashlib
root=Path(__file__).resolve().parent
dst=root/"layout-test/assets/entrance/v11"
bg=dst/"entrance_clean_redraw_546x483.png"
assert Image.open(bg).size==(546,483)
# Four corners lie inside the green inset, avoiding its wooden border.
target=np.float32([[419,168],[505,194],[504,343],[419,285]])
source=np.float32([[84,61],[194,61],[194,144],[84,144]])
H=cv2.getPerspectiveTransform(source,target)
Hinv=np.linalg.inv(H)
if not np.isfinite(Hinv).all():raise RuntimeError("invalid perspective transform")
coords=np.concatenate([source,np.ones((4,1),dtype=np.float32)],axis=1)
result=(H@coords.T).T
result=result[:,:2]/result[:,2,None]
assert np.max(np.abs(result-target))<.02
s=4
a=Image.new("L",(546*s,483*s),0)
draw=ImageDraw.Draw(a)
draw.polygon([(int(x*s),int(y*s)) for x,y in target],fill=255)
mask=a.resize((546,483),Image.Resampling.LANCZOS)
out=dst/"front_photo_mask_v11.png"
mask.save(out,optimize=True)
count=int(np.count_nonzero(np.asarray(mask)))
assert 8000<count<15000,count
manifest=json.loads((dst/"source_manifest.json").read_text(encoding="utf-8"))
manifest.update({"front_mask_file":str(out.relative_to(root)).replace("\\","/"),"front_mask_sha256":hashlib.sha256(out.read_bytes()).hexdigest(),"front_mask_nonzero_pixels":count,"front_quad":[[int(x),int(y)] for x,y in target],"front_source_corners":[[int(x),int(y)] for x,y in source],"front_inverse_homography":Hinv.tolist(),"open_issues":["central door light remains part of the newly drawn architecture","review portrait frame fit and the 3D wall image projection in actual browser"],"browser_qa":"not_run"})
(dst/"source_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"front_H_inverse":Hinv.tolist(),"front_mask_pixels":count},indent=2))
