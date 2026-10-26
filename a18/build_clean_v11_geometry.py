"""Recreate front-wall projection only from the approved architectural image."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,cv2,json,hashlib
root=Path(__file__).resolve().parent
dst=root/"layout-test/assets/entrance/v11"
bg=dst/"entrance_clean_redraw_546x483.png"
if Image.open(bg).size!=(546,483):raise ValueError("E_BG_DIM")
# All corners are strictly within the newly approved cream inset, not on the frame.
target=np.float32([[420,169],[509,194],[507,387],[415,294]])
source=np.float32([[84,61],[194,61],[194,144],[84,144]])
H=cv2.getPerspectiveTransform(source,target)
inverse=np.linalg.inv(H)
if not np.isfinite(inverse).all():raise ValueError("E_H_INVALID")
proj=(H@np.c_[source,np.ones(4)].T).T
proj=proj[:,:2]/proj[:,2,None]
if np.abs(proj-target).max()>=0.02:raise ValueError("E_H_MISMATCH")
ss=4
im=Image.new("L",(546*ss,483*ss),0)
ImageDraw.Draw(im).polygon([(round(x*ss),round(y*ss)) for x,y in target],fill=255)
out=dst/"front_photo_mask_v11.png"
im.resize((546,483),Image.Resampling.LANCZOS).save(out,optimize=True)
count=int(np.count_nonzero(np.asarray(Image.open(out))))
if not 12000<count<21000:raise ValueError(("E_MASK_COUNT",count))
manifest_path=dst/"source_manifest.json"
manifest=json.loads(manifest_path.read_text(encoding="utf-8"))
manifest.update({"front_mask_file":out.relative_to(root).as_posix(),"front_mask_sha256":hashlib.sha256(out.read_bytes()).hexdigest(),"front_mask_nonzero_pixels":count,"front_quad":target.astype(int).tolist(),"front_source_corners":source.astype(int).tolist(),"front_inverse_homography":inverse.tolist()})
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("FRONT_INVERSE=",json.dumps(inverse.tolist()),"MASK_PIXELS",count)
