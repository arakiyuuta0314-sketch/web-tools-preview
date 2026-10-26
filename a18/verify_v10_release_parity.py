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
 assert hashlib.sha256(src_bytes).hexdigest()==sha,'source drift '+rel
 assert hashlib.sha256(dest_bytes).hexdigest()==sha,'release mismatch '+rel
print('A18_SOURCE_RELEASE_BYTES_MATCH',len(items),'sha256 files')
