"""Fail-fast guard: the exact 17 source-authored runtime files must match release.
Run: python a18/verify_v10_release_parity.py C:\...\a18-totteoki-museum-pages
"""
import hashlib,json,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
assert len(sys.argv)==2,'provide release repository root'
release=Path(sys.argv[1]).resolve()/'layout-test'
manifest=json.loads((HERE/'V10_SOURCE_TO_PAGES_MANIFEST.json').read_text('utf8'))
items=manifest['copies']
assert len(items)==17,'unexpected release file list'
for rel,sha in items.items():
 src=HERE/'layout-test'/rel
 dest=release/rel
 assert src.is_file() and dest.is_file(), 'missing release file '+rel
 src_bytes=src.read_bytes()
 dest_bytes=dest.read_bytes()
 # Windows Git worktrees may normalize LF to CRLF on checkout.
 # Compare canonical Git-style text bytes; binary PNGs remain byte-exact.
 def digest(blob):return hashlib.sha256(blob).hexdigest()
 if src.suffix.lower() in ('.js','.html','.json','.css','.md'):
  s_norm=src_bytes.replace(b'\r\n',b'\n')
  d_norm=dest_bytes.replace(b'\r\n',b'\n')
  assert s_norm==d_norm,'text differs '+rel
  assert sha in (digest(src_bytes),digest(s_norm)),'source drift '+rel
  assert sha in (digest(dest_bytes),digest(d_norm)),'release mismatch '+rel
 else:
  assert src_bytes==dest_bytes,'binary differs '+rel
  assert digest(src_bytes)==sha,'binary source drift '+rel
print('A18_SOURCE_RELEASE_BYTES_MATCH',len(items),'sha256 files')
