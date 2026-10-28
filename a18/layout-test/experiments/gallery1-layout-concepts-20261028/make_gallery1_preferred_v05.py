"""Gallery1 v05 proposed final placement as reusable layers, not live game changes."""
from pathlib import Path
from PIL import Image,ImageChops
from shared_gallery_art_style_v01 import render_base,draw_north_passage,draw_rear_frames,place_exhibition_wall,place_display_feature
import json
P=Path(__file__).resolve().parent
m=json.loads((P/'gallery1_v04_layout_options.json').read_text(encoding='utf8'))
cfg=m['options']['P_stagger']
W,H=m['fixed']['floorSize']
transparent=lambda:Image.new('RGBA',(W,H),(0,0,0,0))
arch=render_base(W,H,bays=4,side_openings=('right',))
draw_north_passage(arch,*m['fixed']['northExit'])
rear=transparent()
draw_rear_frames(rear,m['fixed']['rearFrames'])
island4=transparent();place_exhibition_wall(island4,*cfg['left'],4,True)
island5=transparent();place_exhibition_wall(island5,*cfg['right'],5,False)
facility=transparent();place_display_feature(facility,*cfg['desk'])
side=Image.open(P/'gallery1_B_side_walls_layer_v03.png').convert('RGBA')
layers=[('architecture',arch),('rear_photo_placeholders',rear),('wall4',island4),('wall5',island5),('guide_desk',facility),('side_walls',side)]
for name,img in layers:
 img.save(P/f'gallery1_v05_layer_{name}.png',optimize=True)
combined=transparent()
for name,img in layers: combined=Image.alpha_composite(combined,img)
ref=Image.open(P/'gallery1_v04_P_stagger.png').convert('RGBA')
diff=ImageChops.difference(combined,ref)
assert diff.getbbox() is None,('layer composite must equal P',diff.getbbox())
combined.save(P/'gallery1_v05_preferred_layout.png',optimize=True)
spec={
 'status':'recommended layout candidate, awaits user acceptance',
 'room':'展示室1','roomId':1,
 'size':[W,H],'entrance':{'edge':'east','openY':[226,313],'to':'エントランス'},
 'exit':{'edge':'north','archBounds':m['fixed']['northExit'],'to':'展示室3'},
 'wallWest':'closed','wallSouth':'display boundary (not drawn as a rear-facing wall)',
 'frames':{'rear':m['fixed']['rearFrames'],'wall4':cfg['left'],'wall5':cfg['right'],'total':5,
 'note':'1-3 shown as placeholders and wall4,wall5 sprite placeholders; must be runtime photo fixtures in game'},
 'guideDesk':cfg['desk'],
 'visualOrder':[x[0] for x in layers],
 'layers':{name:f'gallery1_v05_layer_{name}.png' for name,_ in layers},
 'image':'gallery1_v05_preferred_layout.png',
 'QA':'still-compositing pixel exact and simple approximate circulation graph, not live game',
 'nextRoomReuse':'use shared_gallery_art_style_v01.py and replace layout coordinates + doorway configuration'
}
(P/'gallery1_v05_preferred_manifest.json').write_text(json.dumps(spec,indent=2,ensure_ascii=False),encoding='utf8')
print('PASS exact reconstructed layer equality, six independent concept layers')
print('RECOMMEND',P/'gallery1_v05_preferred_layout.png')
