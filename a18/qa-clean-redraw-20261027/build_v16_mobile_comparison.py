from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
base=Path(__file__).resolve().parents[1]
qa=base/'qa-clean-redraw-20261027'
orig=Image.open(base/'layout-test/assets/entrance/v09/entrance_architecture_v10.png').convert('RGB')
new=Image.open(qa/'v16-browser-render-background-546x483.png').convert('RGB')
assert orig.size==new.size==(546,483)
out=Image.new('RGB',(546,2*(483+50)),(245,242,236))
try:font=ImageFont.truetype(r'C:\Windows\Fonts\meiryo.ttc',19)
except:font=ImageFont.load_default()
dr=ImageDraw.Draw(out)
for idx,(name,img) in enumerate([('修正前：正式基準の構図',orig),('修正後：構図固定・画質改善案 v16',new)]):
 y=idx*(483+50)
 dr.text((16,y+12),name,font=font,fill=(38,38,40))
 out.paste(img,(0,y+50))
out.save(qa/'v16-before-after-mobile-vertical.png')
print(qa/'v16-before-after-mobile-vertical.png')
