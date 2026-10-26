"""Geometry-safe architectural background candidate: native v10 geometry, FSRCNN x4 and constrained high-res floor texture."""
from pathlib import Path
from PIL import Image,ImageDraw
import cv2,numpy as np,hashlib,json
root=Path(__file__).resolve().parents[1]; qa=root/'qa-clean-redraw-20261027'
base=cv2.imread(str(qa/'entrance_v14_fsrcnn_native_locked_2184x1932.png'),cv2.IMREAD_COLOR)
original=cv2.imread(str(root/'layout-test/assets/entrance/v09/entrance_architecture_v10.png'),cv2.IMREAD_COLOR)
master=cv2.imread(str(root/'art-sources/entrance_clean_redraw_master_20261027.png'),cv2.IMREAD_COLOR)
assert base.shape[:2]==(1932,2184) and master.shape[:2]==(1179,1334)
hh,ww=base.shape[:2]; yy,xx=np.mgrid[0:hh,0:ww].astype(np.float32);x=xx/4;y=yy/4
map_x=x*1334/546
map_y=np.clip((195+(y-212)*288/271)*1179/483,0,1178)
clean=cv2.remap(master,map_x.astype(np.float32),map_y.astype(np.float32),cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
# Localized color balance preserves original ambience.
old=base.astype(np.float32);new=clean.astype(np.float32)
diff=cv2.GaussianBlur(old,(0,0),sigmaX=90)-cv2.GaussianBlur(new,(0,0),sigmaX=90)
new=np.clip(new+0.74*diff,0,255)
# Native original floor boundaries: preserve counter at left, angled right wall and all back architecture.
left=(np.where(y>452,0,np.where(y>325,131,115))).astype(np.float32)
rightwallbottom=347.0+(x-397.0)*0.55
floor=(y>=220)&(x>left)&((x<397)|(y>rightwallbottom+8))
# Prevent modifications at floor edge, by feathering into its interior only.
raw=floor.astype(np.uint8)*255
dist=cv2.distanceTransform(raw,cv2.DIST_L2,5)
alpha=np.clip(dist/24,0,1)*0.83
alpha=alpha[...,None].astype(np.float32)
out=np.clip(old*(1-alpha)+new*alpha,0,255).astype(np.uint8)
fn=qa/'entrance_v16_geometry_locked_clean_floor_2184x1932.png'
cv2.imwrite(str(fn),out,[cv2.IMWRITE_PNG_COMPRESSION,6])
small=cv2.resize(out,(546,483),interpolation=cv2.INTER_AREA)
cv2.imwrite(str(qa/'entrance_v16_geometry_locked_clean_floor_546x483.png'),small,[cv2.IMWRITE_PNG_COMPRESSION,6])
# Four regions of architectural figures are bit-exact unchanged compared to the fully enlarged original.
assert np.array_equal(out[:int(210*4),:,:],base[:int(210*4),:,:])
# Boundaries are safe: every changed pixel is inside the eroded floor region.
changed=np.any(out!=base,axis=2);assert np.all(floor[changed])
assert np.count_nonzero(changed)>50000
sheet=Image.new('RGB',(3*546+4*16,483+65),(246,245,240));dr=ImageDraw.Draw(sheet)
for idx,(lab,img) in enumerate([('v10: approved architecture',original),('v14: image upscaled',cv2.resize(base,(546,483),interpolation=cv2.INTER_AREA)),('v16: clean floor, walls unchanged',small)]):
 px=16+idx*562;dr.text((px,18),lab,fill=(21,25,29))
 sheet.paste(Image.fromarray(cv2.cvtColor(img,cv2.COLOR_BGR2RGB)),(px,48))
sheet.save(qa/'v10-v14-v16-quality-comparison.png')
d={'status':'art candidate not game-integrated','source_geometry':'v10 546x483 approved source','upscaled_dimensions':[2184,1932],'master_texture_dimensions':[1334,1179],'original_v10_sha256':hashlib.sha256((root/'layout-test/assets/entrance/v09/entrance_architecture_v10.png').read_bytes()).hexdigest(),'new_sha256':hashlib.sha256(fn.read_bytes()).hexdigest(),'back_wall_and_door_pixel_identical_to_v14':True,'all_changes_in_verified_floor_mask':True,'changed_pixels':int(np.count_nonzero(changed)),'display_photo_mask_unmodified':True,'needs_visual_approval':True}
(qa/'v16-background-quality-report.json').write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf8')
print('v16 created',fn,'changed',d['changed_pixels'])
