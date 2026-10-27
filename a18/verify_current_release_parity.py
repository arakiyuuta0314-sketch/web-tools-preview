"""Verify that every published A18 playtest file exists in development source, byte-exact
for binary, LF-normalized for text; fail-fast on stale manifests or rejected previews.

Usage: python a18/verify_current_release_parity.py C:/Users/User/source/repos/a18-totteoki-museum-pages
"""
import hashlib
import json
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
assert len(sys.argv)==2,'provide A18 published repository root'
source=HERE/'layout-test'
release=Path(sys.argv[1]).resolve()/'layout-test'
manifest=json.loads((HERE/'A18_CURRENT_SOURCE_TO_PAGES_MANIFEST.json').read_text(encoding='utf-8'))
assert source.is_dir() and release.is_dir()
copies=manifest['copies']
assert len(copies)>=257,'unexpectedly small published inventory'
text_ext={'.js','.html','.json','.css','.md','.svg','.webmanifest','.txt'}
def normalized(path):
    blob=path.read_bytes()
    return blob.replace(b'\r\n',b'\n') if path.suffix.lower() in text_ext else blob
actual={p.relative_to(release).as_posix() for p in release.rglob('*') if p.is_file()}
assert set(copies)==actual,{'missing':sorted(set(copies)-actual)[:25], 'unexpected':sorted(actual-set(copies))[:25]}
assert not any(path.startswith('placement-editor/') for path in copies),'rejected editor in source release'
for rel,expected_sha in copies.items():
    s=source/rel
    r=release/rel
    assert s.is_file() and r.is_file(), 'missing file '+rel
    sh=hashlib.sha256(normalized(s)).hexdigest()
    rh=hashlib.sha256(normalized(r)).hexdigest()
    assert sh==expected_sha, 'stale development source '+rel
    assert rh==expected_sha, 'release drift '+rel
print('A18_CURRENT_RELEASE_PARITY_PASS',len(copies),'files',manifest['approved_published_commit'])