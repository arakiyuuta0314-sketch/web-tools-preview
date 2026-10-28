"""Pack the editor into a single HTML for offline opening and a folder ZIP."""
from pathlib import Path
import base64,zipfile,re
from PIL import Image
D=Path(__file__).resolve().parent
src=(D/'index.html').read_text('utf8')
for file in ['architecture.png','wall4.png','wall5.png','counter175.png','side-walls.png']:
    tag='src="'+file+'"'
    assert src.count(tag)==1, (file,src.count(tag))
    mime='data:image/png;base64,'+base64.b64encode((D/file).read_bytes()).decode('ascii')
    src=src.replace(tag,'src="'+mime+'"')
script=(D/'editor.js').read_text('utf8')
assert '<script src="editor.js"></script>' in src
src=src.replace('<script src="editor.js"></script>','<script>\n'+script+'\n</script>')
name='gallery1-layout-editor-v06-offline.html'
(D/name).write_text(src,encoding='utf8')
with zipfile.ZipFile(D/'gallery1-layout-editor-v06.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for file in ['index.html','editor.js','architecture.png','wall4.png','wall5.png',
                 'counter175.png','side-walls.png','initial-layout.json','README.md']:
        if (D/file).exists():z.write(D/file,arcname=file)
print('PASS: self-contained HTML and ZIP',[(p.name,p.stat().st_size) for p in D.iterdir() if p.name.endswith(('.html','.zip'))])
