"""Faithful v10-geometry image super-resolution trial (does not redraw architecture)."""
from pathlib import Path
import sys,hashlib,json,time
sys.path.insert(0,r'C:\Users\User\AppData\Local\Temp\a18-cv-superres')
import cv2
import numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
out=root/'qa-clean-redraw-20261027'
source=root/'layout-test/assets/entrance/v09/entrance_architecture_v10.png'
raw=cv2.imread(str(source),cv2.IMREAD_COLOR)
assert raw is not None and raw.shape[:2]==(483,546)
model=r'C:\Users\User\AppData\Local\Temp\a18-fsrcnn-x4.pb'
assert Path(model).stat().st_size==41661
print('cv2',cv2.__version__,'model',model,flush=True)
sr=cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel(model)
sr.setModel('fsrcnn',4)
start=time.time()
up=sr.upsample(raw)
assert up.shape[:2]==(1932,2184)
target=out/'entrance_v14_fsrcnn_native_locked_2184x1932.png'
cv2.imwrite(str(target),up,[cv2.IMWRITE_PNG_COMPRESSION,6])
bicubic=cv2.resize(raw,(2184,1932),interpolation=cv2.INTER_CUBIC)
candidate_down=cv2.resize(up,(546,483),interpolation=cv2.INTER_AREA)
# identical architecture: v10 source input geometry, no masks or movable elements touched.
sheet=Image.new('RGB',(3*546+4*16,483+62),(247,246,242))
draw=ImageDraw.Draw(sheet)
for i,(label,im) in enumerate([('v10 original',raw),('v14 FSRCNN source pixels',candidate_down),('v14 4x display, reduced 2x',cv2.resize(up,(546,483),interpolation=cv2.INTER_CUBIC))]):
    x=16+i*562
    draw.text((x,18),label,fill=(35,36,38))
    sheet.paste(Image.fromarray(cv2.cvtColor(im,cv2.COLOR_BGR2RGB)),(x,48))
sheet.save(out/'v14-fsrcnn-comparison.png')
report={'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'model_filename':'FSRCNN_x4.pb','source':'https://github.com/Saafke/FSRCNN_Tensorflow','source_dimensions':[546,483],'output_dimensions':[2184,1932],'elapsed_seconds':time.time()-start,'output_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'original_image_unchanged':True,'architecture_coordinates_unchanged':True,'quality_status':'candidate; must inspect for synthetic ringing, smoothness and fidelity'}
(out/'v14-fsrcnn-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('output',target,'elapsed',report['elapsed_seconds'],flush=True)
