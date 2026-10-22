"""Generate the publicly accessible app hub from reviewed app-catalog.json.

The catalog only points to already published public previews. Never copy local
project source or user information during this step.
"""
from pathlib import Path
from urllib.parse import urlsplit
from html import escape
import json, re

ROOT=Path(__file__).resolve().parent
data=json.loads((ROOT/"app-catalog.json").read_text(encoding="utf-8"))
assert data["schemaVersion"]==1
apps=data["entries"]
assert apps
ids=set()
def valid_url(url):
    if url.startswith("./"):
        local=urlsplit(url).path
        p=Path(local)
        if any(part in (".","..") or part.startswith(".") for part in p.parts if part!=".") or "\\" in local or "%" in local:
            raise ValueError("Unsafe preview path: "+url)
        resolved=(ROOT/local).resolve()
        if not resolved.is_relative_to(ROOT):
            raise ValueError("Outside repo: "+url)
        if resolved.is_dir():
            resolved=resolved/"index.html"
        if not resolved.is_file():
            raise FileNotFoundError(resolved)
        return
    parts=urlsplit(url)
    if parts.scheme!="https" or parts.netloc!="arakiyuuta0314-sketch.github.io":
        raise ValueError("Unapproved external preview URL: "+url)

for app in apps:
    ident=app["id"]
    if not re.fullmatch("[a-z0-9-]+", ident) or ident in ids:
        raise ValueError("Invalid or repeated ID: "+ident)
    ids.add(ident)
    if app["stage"] not in ("開発中","Webプレビュー","Webテスト"):
        raise ValueError("Unknown status: "+app["stage"])
    for field in ("name","subtitle","description","emoji","version","cta"):
        if not isinstance(app.get(field),str) or not app[field]:
            raise ValueError("Missing "+field+": "+ident)
    valid_url(app["url"])
    for link in app.get("links",[]):
        assert link["label"]
        valid_url(link["url"])

def e(x):
    return escape(str(x),quote=True)

def card(app):
    links="".join('<a href="{}">{} <span aria-hidden="true">↗</span></a>'.format(e(l["url"]),e(l["label"])) for l in app.get("links",[]))
    searchable=" ".join(str(app[k]) for k in ("name","subtitle","description","version","stage")).lower()
    return """
<article class="card" data-app-id="{id}" data-search="{search}">
 <a class="card-main" href="{url}" aria-label="{name} — {cta}">
  <span class="card-top"><span class="icon-plate" aria-hidden="true">{emoji}</span><span class="stage-tag">{stage}</span></span>
  <span class="card-copy"><span class="app-name">{name}</span><span class="app-tagline">{subtitle}</span></span>
  <span class="app-description">{description}</span>
  <span class="card-bottom"><span class="version">{version}</span><span class="open-link">{cta} <span aria-hidden="true">→</span></span></span>
 </a>
 {other}
</article>""".format(id=e(app["id"]),search=e(searchable),url=e(app["url"]),name=e(app["name"]),
       cta=e(app["cta"]),emoji=e(app["emoji"]),stage=e(app["stage"]),subtitle=e(app["subtitle"]),
       description=e(app["description"]),version=e(app["version"]),
       other='<nav class="other-links" aria-label="{}の過去版と比較資料">{}</nav>'.format(e(app["name"]),links) if links else "")

def group(key,title,description,entries):
    if not entries:
        return ""
    return """
<section class="group" data-group="{key}" aria-labelledby="{key}-heading">
 <div class="group-head"><div><h2 id="{key}-heading">{title}</h2><p>{description}</p></div><span class="group-count">{count}作品</span></div>
 <div class="cards">{cards}</div>
</section>""".format(key=key,title=e(title),description=e(description),count=len(entries),cards="\n".join(map(card,entries)))

developing=[a for a in apps if a["stage"]=="開発中"]
others=[a for a in apps if a["stage"]!="開発中"]
head='''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f2f8f3">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="description" content="{desc}">
<title>{title}</title>
<link rel="stylesheet" href="./app-index.css">
<script src="./app-index.js" defer></script>
</head>
<body><main>
<header class="hero">
 <div class="eyebrow"><span aria-hidden="true">✦</span> YUTA'S WEB APP STUDIO</div>
 <h1>アプリ開発室</h1>
 <p class="lead">制作中のアプリも、完成に近づいたアプリも。<br>いま試せるWeb版をここにまとめています。</p>
 <div class="hero-meta"><span><strong>{total}</strong> 作品</span><span><strong>{devs}</strong> 開発中</span><span>スマホ・PCで確認できます</span></div>
</header>
<section class="find" aria-label="作品を探す">
 <label for="appSearch">作品を探す</label>
 <div class="search-wrap"><span aria-hidden="true">⌕</span><input type="search" id="appSearch" placeholder="アプリ名や内容で検索" autocomplete="off"></div>
 <span id="searchStatus" class="search-status" aria-live="polite">{total}作品を表示中</span>
</section>
<div id="catalog">{groups}</div>
<p id="noResults" class="no-results" hidden>該当するアプリはありません。別の言葉で検索してください。</p>
<section class="info" aria-labelledby="about-heading">
 <h2 id="about-heading">このページについて</h2>
 <p>新しいアプリは原則、<strong>Webで試作 → 操作・機能を確認 → iPhoneアプリとして仕上げる</strong>順で開発しています。公開準備中のものや開発途中の版も一覧に加えます。</p>
 <p>このサイトはURLを知っていれば誰でもアクセスできるテスト用サイトです。Appleの課金・AdMob広告・通知など、iPhone固有の機能はWeb版で完全には再現されません。試作中の作品データは端末のブラウザに保存される場合があり、更新や履歴削除で消えることがあります。大切な情報の保管には使用しないでください。</p>
 <p>FLIP &amp; FIX Marketは別のGitHub Pagesサイトで開きます。Web版の公開状況とApp Storeでの公開状況は別です。</p>
</section>
<footer><span>© 2026 ゆた｜Webアプリ開発室</span><span>公開中の試作・確認用サイト</span></footer>
</main></body></html>
'''
page=head.format(desc=e(data["siteDescription"]),title=e(data["siteTitle"]),total=len(apps),devs=len(developing),groups=
    group("developing","開発中のアプリ","更新しながら操作と機能を確かめているWeb試作です。",developing)+
    group("previews","Web版・試遊版","作成したアプリをブラウザで試せるプレビューです。",others))
page="\n".join(line.rstrip() for line in page.splitlines())+"\n"
(ROOT/"index.html").write_text(page,encoding="utf-8")
print("WEB_HUB_BUILT",len(apps),"APPS",len(developing),"IN_DEVELOPMENT",len(others),"WEB_PREVIEWS")
