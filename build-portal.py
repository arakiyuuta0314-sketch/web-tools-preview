"""Build a simple internal-use link hub from known working public previews.
Only the app names, current preview links, and small state labels are shown.
No historical/comparison links, promotional copy, or release policy.
"""
from pathlib import Path
from urllib.parse import urlsplit
from html import escape
import json, re

root=Path(__file__).resolve().parent
catalog=json.loads((root/"app-catalog.json").read_text(encoding="utf-8"))
apps=catalog["entries"]
assert catalog["schemaVersion"]==1 and apps
ids=set()
for app in apps:
    key=app["id"]
    assert re.fullmatch(r"[a-z0-9-]+",key) and key not in ids
    ids.add(key)
    u=app["url"]
    if u.startswith("./"):
        rel=urlsplit(u).path
        destination=(root/rel).resolve()
        assert destination.is_relative_to(root) and ".." not in Path(rel).parts
        if destination.is_dir(): destination=destination/"index.html"
        assert destination.is_file(),destination
    else:
        x=urlsplit(u)
        assert x.scheme=="https" and x.hostname=="arakiyuuta0314-sketch.github.io",u

def e(t):return escape(str(t),quote=True)
items=[]
for app in apps:
    status="開発中" if app["stage"]=="開発中" else "Web版"
    items.append('''<a class="app" href="{url}">
      <span class="emoji" aria-hidden="true">{emoji}</span>
      <span class="body"><strong>{name}</strong><small>{status}</small></span>
      <span class="arrow" aria-hidden="true">→</span>
    </a>'''.format(url=e(app["url"]),emoji=e(app["emoji"]),name=e(app["name"]),status=e(status)))

html='''<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#f7faf7">
<title>アプリ一覧</title>
<link rel="stylesheet" href="app-index.css">
</head><body>
<main><header><h1>アプリ一覧</h1><p>開発中・確認用のWeb版をまとめています。</p></header>
<nav class="apps" aria-label="アプリ一覧">
{items}
</nav>
<p class="note">開発用のリンク集です。Web版の今後の扱いは未定です。</p>
</main></body></html>
'''.format(items="\n".join(items))
(root/"index.html").write_text(html,encoding="utf-8")
print("SIMPLE_HUB_BUILT",len(apps),"APPS")
