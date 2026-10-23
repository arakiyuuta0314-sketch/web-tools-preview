"""P7-B Release static audit: checks actual staging files; no browser profile access."""
from pathlib import Path
import argparse, hashlib, json, re, csv, fnmatch, struct, sys
from urllib.parse import urlsplit,unquote

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--dist",required=True)
    p.add_argument("--out",required=True)
    a=p.parse_args()
    dist=Path(a.dist).resolve()
    out=Path(a.out).resolve()
    out.mkdir(parents=True,exist_ok=True)
    game=dist/"layout-test"
    files=sorted(p for p in dist.rglob("*") if p.is_file())
    inventory=[]
    findings=[]
    def find(code,detail,severity="ERROR"):
        findings.append({"severity":severity,"code":code,"detail":str(detail)})
    def resolve(ref,base=game):
        ref=unquote(ref.split("?",1)[0].split("#",1)[0])
        if not ref or ref.startswith(("data:","blob:","http:","https:","//","#")):return
        if ref.startswith("/"):return dist/ref.lstrip("/")
        return (base/ref).resolve()
    for f in files:
        rel=f.relative_to(dist).as_posix()
        data=f.read_bytes()
        inventory.append({"file":rel,"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()})
        if not f.suffix.lower() in {".png",".json",".css",".js",".html",".webmanifest",".svg",".webp",".jpg",".jpeg",".ico",".woff",".woff2"}:
            find("UNEXPECTED_EXTENSION",rel)
        if f.suffix.lower()==".png":
            if len(data)<24 or data[:8]!=b"\x89PNG\r\n\x1a\n" or struct.unpack(">II",data[16:24])[0] == 0:
                find("BAD_PNG",rel)
        if f.suffix.lower() in (".json",".webmanifest"):
            try:json.loads(data)
            except Exception as e:find("INVALID_JSON",f"{rel} {e}")
    banned=["dev-reset.js","harness.html","layout-storage.js","layout-editor.js","art-inspect-test.js","synthetic-tests.js"]
    for f in files:
        rel=f.relative_to(dist).as_posix().lower()
        if any(part=="tests" for part in Path(rel).parts) or any(Path(rel).name==n for n in banned):
            find("DEV_ASSET_PRESENT",rel)
    build=json.loads((dist/"_a18_build_manifest.json").read_text("utf8"))
    if build.get("flavor")!="release":find("NOT_RELEASE_FLAVOR",build.get("flavor"))
    declared={f["file"]:f for f in build.get("allFiles",[])}
    omitted=[x["file"] for x in inventory if x["file"] not in declared and x["file"]!="_a18_build_manifest.json"]
    for key,item in declared.items():
        target=dist/key
        if not target.is_file():find("BUILD_MANIFEST_MISSING",key)
        elif hashlib.sha256(target.read_bytes()).hexdigest()!=item["sha256"]:find("BUILD_MANIFEST_MISMATCH",key)
    if omitted:find("BUILD_MANIFEST_INCOMPLETE",str(len(omitted))+" files unlisted","WARNING")
    patterns=[(r"(?i)(?:deleteDatabase|setFault|resetMuseum)\s*\(", "DANGEROUS_API"),
              (r"(?i)(?:p2-e2e|dev-reset\.js|layout-storage\.js|a18-museum-p2-isolated-v3)", "DEBUG_OR_LEGACY_REFERENCE")]
    for f in files:
        if f.suffix.lower() not in (".js",".html",".mjs"):continue
        body=f.read_text("utf8",errors="replace")
        for pattern,code in patterns:
            if re.search(pattern,body):find(code,f.relative_to(dist))
    assets=[]
    def track(ref,origin,base=game,strict=True):
        if not isinstance(ref,str):return
        if not re.search(r"\.(?:png|webp|jpe?g|gif|svg|css|js|json|webmanifest)(?:[?#].*)?$",ref,re.I):return
        target=resolve(ref,base)
        if target is None:return
        wildcard=str(target).replace("{direction}","*").replace("{frame}","*")
        found=(list(Path(wildcard).parent.glob(Path(wildcard).name)) if "*" in wildcard else [target] if target.exists() else [])
        assets.append({"source":origin,"reference":ref,"matches":len(found)})
        if strict and not found:find("MISSING_REFERENCED_ASSET",origin+" -> "+ref)
        for item in found:
            try:item.relative_to(dist)
            except ValueError:find("ESCAPES_RELEASE_ROOT",origin+" -> "+ref)
    html=(game/"index.html").read_text("utf8")
    for ref in re.findall(r"(?:src|href)\s*=\s*['\"]([^'\"]+)['\"]",html,re.I):
        track(ref,"index.html")
    for css in dist.rglob("*.css"):
        txt=css.read_text("utf8")
        for ref in re.findall(r"url\(\s*['\"]?([^\)'\"]+)['\"]?\s*\)",txt):
            track(ref,css.relative_to(dist).as_posix(),css.parent)
    manifestNames=["layout-assets-manifest.json","p3-architecture-manifest.json","assets/p5/v0.2/p5-manifest.json","p6-event-dialogue-v1.json"]
    for m in manifestNames:
        doc=json.loads((game/m).read_text("utf8"))
        def walk(node):
            if isinstance(node,dict):
                for v in node.values():walk(v)
            elif isinstance(node,list):
                for v in node:walk(v)
            elif isinstance(node,str):
                track(node,m,game/"assets/p5/v0.2" if m.endswith("p5-manifest.json") else game)
        walk(doc)
    characters=list((dist/"scenes-preview/assets/official/characters").glob("*.png"))
    if len(characters)!=48:find("APPROVED_CHARACTERS_NOT_48",len(characters))
    (out/"full_release_sha256.csv").write_text("file,bytes,sha256\n"+"".join(
        '"'+x["file"].replace('"','""')+'",'+str(x["bytes"])+','+x["sha256"]+"\n" for x in inventory),encoding="utf-8-sig")
    (out/"full_release_manifest.json").write_text(json.dumps({"source":"P7-B independent full release file enumeration","files":inventory},ensure_ascii=False,indent=2),encoding="utf8")
    report={"fileCount":len(files),"totalBytes":sum(x["bytes"] for x in inventory),
        "buildManifestEntries":len(declared),"buildManifestUnlistedFiles":omitted,
        "assetReferencesChecked":len(assets),"approvedCharacterCount":len(characters),
        "findings":findings,"errors":sum(x["severity"]=="ERROR" for x in findings),
        "warnings":sum(x["severity"]=="WARNING" for x in findings)}
    (out/"static_audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
    print(json.dumps({k:v for k,v in report.items() if k not in ("findings","buildManifestUnlistedFiles")},ensure_ascii=False))
    print("FINDINGS",json.dumps(findings[:35],ensure_ascii=False))
    return 1 if report["errors"] else 0

if __name__=="__main__":sys.exit(main())
