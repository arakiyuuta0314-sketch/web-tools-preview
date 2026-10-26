"""Build bounded, reversible visual patches from approved v09 OFF architecture.
No external generated image, no geometry change outside the listed rectangles.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np, cv2, json, hashlib
ROOT=Path(__file__).resolve().parent
F=ROOT/'layout-test/assets/entrance/v09'
original=F/'entrance_architecture_v09.png'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(original)=='565c990b0b4a1d91a7d07310c7ae20566edae1fb3ea31943371b573601e01aca'
base=np.asarray(Image.open(original).convert('RGB')).copy()
assert base.shape==(483,546,3)
# Correct a small damaged beige floor transition left by object cleanup, without
# touching the surviving reception desk/handrail: the mask is entirely floor-side.
# The source image is immutable, all changed pixels are accounted for.
mask=np.zeros((483,546),dtype=np.uint8)
cv2.ellipse(mask,(94,326),(12,20),0,0,360,255,-1)
# Poisson-clone undamaged floor from 70px to the right; inpainting here
# sampled the reception desk's dark edge, making the deletion mark *worse*.
shifted=base.copy()
shifted[:,:476]=base[:,70:]
shifted[:,476:]=base[:,-1:,:]
repaired=cv2.seamlessClone(cv2.cvtColor(shifted,cv2.COLOR_RGB2BGR),
 cv2.cvtColor(base,cv2.COLOR_RGB2BGR),mask,(94,326),cv2.NORMAL_CLONE)
repaired=cv2.cvtColor(repaired,cv2.COLOR_BGR2RGB)
changed=np.any(repaired!=base,axis=2)
assert 100<changed.sum()<1400
output=repaired
# Leave other image content exactly unchanged.
assert np.array_equal(output[~changed],base[~changed])
bg=F/'entrance_architecture_v10.png'
Image.fromarray(output,'RGB').save(bg,optimize=True)
# Dynamic rear frames need the old fixed landscape matte erased only while a
# photograph is installed. Use green wallpaper from adjoining undamaged strips.
# Overlay has transparent pixels everywhere except the two known green panels.
patch=np.zeros((483,546,4),dtype=np.uint8)
regions={'rear_left':[38,58,195,151],'rear_right':[369,58,511,151]}
for label,(x0,y0,x1,y1) in regions.items():
  # sample wall wallpaper from outside the baked rectangular mat; y-wise
  # samples preserve the original lighting gradient.
  for y in range(y0,y1):
    l=np.median(output[y,max(x0-7,0):x0-3].astype(float),axis=0)
    rr=np.median(output[y,x1+3:x1+7].astype(float),axis=0)
    # green panels should not accidentally sample wooden column outlines.
    if max(l)>140 or max(rr)>140 or l[1]>105 or rr[1]>105:
      print('wall sample anomaly',label,y,l,rr)
    for x in range(x0,x1):
      t=(x-x0)/(x1-x0-1)
      blend=l*(1-t)+rr*t
      # subtle row-based variation from the adjacent wallpaper; no random fills
      noise=((int(x*13+y*7)%17)-8)*.12
      patch[y,x,:3]=np.uint8(np.clip(blend+noise,0,255))
      patch[y,x,3]=255
  assert np.all(patch[y0:y1,x0:x1,3]==255)
wall=F/'entrance_rear_clear_v10.png'
Image.fromarray(patch,'RGBA').save(wall,optimize=True)
summary={
 'baseline_sha256':sha(original),
 'background_file':bg.name,'background_sha256':sha(bg),
 'counter_floor_repair_pixels':int(changed.sum()),'counter_region':[84,307,100,340],
 'rear_wall_file':wall.name,'rear_wall_sha256':sha(wall),
 'rear_wall_regions':regions,
 'background_unchanged_outside_repair':True,
}
(F/'v10_visual_manifest.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
# Build audit montage, not part of shipped runtime.
a=Image.fromarray(base).crop((0,203,180,425)).resize((360,444))
b=Image.fromarray(output).crop((0,203,180,425)).resize((360,444))
both=Image.new('RGB',(720,485),'white');both.paste(a,(0,35));both.paste(b,(360,35))
ImageDraw.Draw(both).text((5,8),'Before',fill='black');ImageDraw.Draw(both).text((365,8),'After',fill='black')
audit=ROOT/'docs/qa/v10_counter_before_after.png'
audit.parent.mkdir(parents=True,exist_ok=True)
both.save(audit)
