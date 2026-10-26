"""QA-only renderer integration of geometry-locked clean background. Does not touch main or Pages."""
from pathlib import Path
import subprocess,shutil
repo=Path(__file__).resolve().parents[2]
game=repo/'a18/layout-test'
qa=repo/'a18/qa-clean-redraw-20261027'
stable=subprocess.run(['git','show','main:a18/layout-test/entrance-renderer.js'],cwd=repo,capture_output=True,check=True).stdout
s=stable.decode('utf-8')
assert "background:[ROOT+'entrance_architecture_v10.png',546,483]" in s
assert "ctx.imageSmoothingEnabled=false;ctx.drawImage(imgs.get('background'),0,0)" in s
s=s.replace("background:[ROOT+'entrance_architecture_v10.png',546,483]","background:['assets/entrance/v16/entrance_background_clean_v16_2184x1932.png',2184,1932]")
s=s.replace("ctx.imageSmoothingEnabled=false;ctx.drawImage(imgs.get('background'),0,0)","ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(imgs.get('background'),0,0,546,483)")
s=s.replace('/* A18 v10:','/* A18 v16 QA candidate, geometry-locked v10:')
(game/'entrance-renderer.js').write_text(s,encoding='utf-8',newline='\n')
html=(game/'index.html').read_text(encoding='utf-8')
assert 'entrance-renderer.js?v=11-clean-redraw-20261027' in html
html=html.replace('entrance-renderer.js?v=11-clean-redraw-20261027','entrance-renderer.js?v=16-quality-qa-20261027')
(game/'index.html').write_text(html,encoding='utf-8',newline='\n')
assets=game/'assets/entrance/v16';assets.mkdir(exist_ok=True)
shutil.copy2(qa/'entrance_v16_geometry_locked_clean_floor_2184x1932.png',assets/'entrance_background_clean_v16_2184x1932.png')
print('Rendered QA asset ready',assets)
