"""Shared gallery *concept-art* primitives: reuse approved entrance Lv1 sources.

This is deliberately NOT the live game renderer. Individual room shapes,
photograph fixtures, collisions and saves must be implemented separately after approval.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

THIS=Path(__file__).resolve()
GAME_ROOT=THIS.parents[2]
ASSET=GAME_ROOT/'assets/entrance'
BG_PATH=ASSET/'approved_initial_20261027/entrance_background_initial_approved.png'
PANEL_PATH=ASSET/'counter_candidate_20261028/partition_right_lv1_approved_v11.png'
COUNTER_PATH=ASSET/'counter_candidate_20261028/reception_lshape_lv1_approved_v11.webp'
BG=Image.open(BG_PATH).convert('RGBA')
PANEL=Image.open(PANEL_PATH).convert('RGBA')
COUNTER=Image.open(COUNTER_PATH).convert('RGBA')
assert BG.size==(1322,1190) and PANEL.size==(860,488) and COUNTER.size==(936,428)

WOOD=['#342015','#946031','#B78345','#D2A666','#91602E','#4C301D','#282017']
GREEN='#234D42'
FONT_REG=r'C:\Windows\Fonts\meiryo.ttc'
FONT_BOLD=r'C:\Windows\Fonts\meiryob.ttc'
def font(size,bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG,size)

def crop_resize(src,bounds,dim):
    return src.crop(bounds).resize(tuple(dim),Image.Resampling.LANCZOS)

def draw_frame(canvas,rect,label=None):
    x,y,w,h=rect
    d=ImageDraw.Draw(canvas)
    d.rectangle((x+3,y+4,x+w+3,y+h+4),fill='#1D1914')
    for i,c in enumerate(WOOD):
        d.rectangle((x+i,y+i,x+w-i,y+h-i),outline=c,width=1)
    d.rectangle((x+8,y+8,x+w-8,y+h-8),fill=GREEN)
    if label is not None:
        d.text((x+w/2,y+h/2),str(label),font=font(19,True),fill='#F2DBA1',anchor='mm')

def render_base(width=930,height=582,bays=3,door_height=90):
    assert width>=450 and height>=460 and bays>=2
    im=Image.new('RGBA',(width,height))
    ywall=219
    # A single floor crop from the approved architecture, not a tiled old P3 scene.
    floor=crop_resize(BG,(20,521,1300,1185),(width,height-ywall))
    im.alpha_composite(floor,(0,ywall))
    # Approved deep-green interior and wainscot repeated as long-wall segments.
    pillarw=30
    segmentw=(width-pillarw*(bays+1))//bays
    boundaries=[]
    x=pillarw
    panel_crop=(102,8,470,515)
    for i in range(bays):
        sw=segmentw if i<bays-1 else width-pillarw-x
        im.alpha_composite(crop_resize(BG,panel_crop,(sw,218)),(x,0))
        x+=sw
        if i<bays-1:
            boundaries.append(x)
            x+=pillarw
    # Narrow column segments are derived from the official approved wall.
    col=crop_resize(BG,(512,18,579,515),(pillarw,219))
    for x in (0,*boundaries,width-pillarw):
        im.alpha_composite(col,(x,0))
    # Cornice and wall/floor border
    cornice=crop_resize(BG,(70,0,465,88),(width,38))
    im.alpha_composite(cornice,(0,0))
    d=ImageDraw.Draw(im)
    d.rectangle((0,208,width,220),fill='#382719')
    d.line((0,209,width,209),fill='#B48545',width=2)
    d.line((0,218,width,218),fill='#241B14',width=2)
    # Left/future exit and right/entrance. The upper lane runs continuously across.
    for xx in (0,width-45):
        d.rectangle((xx,219,xx+45,219+door_height),fill='#4D311F')
        d.rectangle((xx+4,225,xx+41,219+door_height-5),fill='#12362F')
        d.line((xx+3,225,xx+3,219+door_height),fill='#C3914E',width=3)
        d.line((xx+43,225,xx+43,219+door_height),fill='#8D582A',width=3)
        d.line((xx+5,219+door_height,xx+41,219+door_height),fill='#E0BD83',width=2)
    return im

def place_exhibition_wall(canvas,x,y,width=240,height=182,number=None,mirror=False):
    assert x>=0 and y>=219 and x+width<=canvas.width and y+height<=canvas.height
    sprite=PANEL.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if mirror else PANEL
    sprite=sprite.resize((width,height),Image.Resampling.LANCZOS)
    canvas.alpha_composite(sprite,(x,y))
    if number is not None:
        # Picture inset follows the *approved* partition geometry and its orientation.
        if mirror:
            dx=x+round(width*.18)
        else:
            dx=x+round(width*.18)
        dy=y+round(height*.33)
        draw_frame(canvas,(dx,dy,round(width*.64),round(height*.40)),number)

def place_display_feature(canvas,x,y,width=210,height=96):
    # Reusing approved entrance oak, reconfigured as a LOW single-sided title pedestal.
    # Optional *concept fixture*, not the entrance's L-shaped reception counter.
    src=COUNTER.crop((19,142,717,422))
    # Keep source aspect ratio close enough, retaining ornamental legs and top profile.
    sprite=src.resize((width,height),Image.Resampling.LANCZOS)
    canvas.alpha_composite(sprite,(x,y))
    dr=ImageDraw.Draw(canvas)
    plaque=(x+round(width*.26),y+round(height*.47),x+round(width*.75),y+round(height*.78))
    dr.rounded_rectangle(plaque,5,fill='#1E493C',outline='#B18445',width=2)
    dr.text(((plaque[0]+plaque[2])/2,(plaque[1]+plaque[3])/2),'案内',font=font(15,True),fill='#E9D6A8',anchor='mm')

def draw_rear_frames(canvas,back):
    for index,(x,y,w,h) in enumerate(back,1):
        draw_frame(canvas,(x,y,w,h),index)
