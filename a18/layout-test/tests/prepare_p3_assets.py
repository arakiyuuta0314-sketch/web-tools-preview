"""Import verified P3 architecture PNG byte-for-byte into the isolated P3 worktree.

Never edit source PNGs, touch IndexedDB, or synthesize missing assets.
"""
from pathlib import Path
from PIL import Image
import hashlib, json, shutil

HERE=Path(__file__).resolve().parent.parent
ROOT=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館')
P3=ROOT/'05_P3_館内美術制作'
SRC={
  1:P3/'gallery02_v0.2'/'01_assets'/'gallery02',
  2:P3/'gallery03_04_v0.1'/'01_assets'/'gallery03',
  3:P3/'gallery03_04_v0.1'/'01_assets'/'gallery04',
  4:P3/'gallery05_06_v0.1'/'01_assets'/'gallery05',
  5:P3/'gallery05_06_v0.1'/'01_assets'/'gallery06',
}
SHARED=P3/'gallery02_v0.2'/'01_assets'
ENTRANCE=ROOT/'02_館内デザイン_制作中'/'entrance_v0.3'/'02_assets'
DEST=HERE/'assets'/'p3'/'v1'
manifest={'logicalSize':[589,482], 'galleryRooms':{},'doors':{},'frames':{},'entrance':{},'sourceHashes':{}}
def record(source,dest,size):
    if not source.is_file():raise FileNotFoundError(source)
    with Image.open(source) as image:
        if image.size!=size or image.mode!='RGBA':
            raise ValueError(f'Unexpected PNG metadata: {source} {image.size} {image.mode}')
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(source,dest)
    original=hashlib.sha256(source.read_bytes()).hexdigest()
    if original!=hashlib.sha256(dest.read_bytes()).hexdigest():
        raise ValueError('Source and imported asset bytes differ')
    manifest['sourceHashes'][dest.relative_to(HERE).as_posix()]=original
    return dest.relative_to(HERE).as_posix()
for room,folder in SRC.items():
    name=f'gallery{room+1:02}'
    suffix='v02' if room==1 else 'v01'
    manifest['galleryRooms'][str(room)]={}
    for layer in ('floor','wall','panel','trim','glow','light'):
        fn=f'{name}_{layer}_{suffix}.png'
        manifest['galleryRooms'][str(room)][layer]=record(folder/fn,DEST/name/fn,(589,482))
for side in ('north','south','west','east'):
    dims=(76,170) if side=='north' else (76,71) if side=='south' else (64,112)
    manifest['doors'][side]={}
    for state in ('open','locked'):
        name=f'door_{side}_{state}_v02.png'
        manifest['doors'][side][state]=record(SHARED/'shared_doors'/name,DEST/'shared_doors'/name,dims)
manifest['frames']['gold']=record(SHARED/'shared_frames'/'gold_9slice_atlas_42_v02.png',DEST/'shared_frames'/'gold_9slice_atlas_42_v02.png',(42,42))
for layer in ('floor_base','wall_base','carpet','sidewalls','door_north','door_west','door_east','frame_9slice_atlas','plant','wall_light','wall_glow'):
    fn=f'entrance_{layer}_v03.png'
    with Image.open(ENTRANCE/fn) as img: dims=img.size
    manifest['entrance'][layer]=record(ENTRANCE/fn,HERE/'assets'/'entrance'/'v0.3'/fn,dims)
out=HERE/'p3-architecture-manifest.json'
out.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'galleries':len(SRC),'layers':30,'doors':8,'gallery_frame_atlas':1,'entrance_source_verified':len(manifest['entrance']),'files':len(manifest['sourceHashes']),'manifest':str(out)},ensure_ascii=False))
