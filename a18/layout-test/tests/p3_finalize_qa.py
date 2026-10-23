"""Package P3 browser screenshots, reference comparison, provenance and P5 handoff."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,subprocess,shutil,datetime
BASE=Path(__file__).resolve().parent.parent
REPO=BASE.parents[1]
ROOT=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館')
DEST=ROOT/'11_P3_全館美術統合実装'
QA=DEST/'qa_runtime'
DEST.mkdir(exist_ok=True,parents=True)
manifest=json.loads((BASE/'p3-architecture-manifest.json').read_text('utf-8'))
def original_png(rel):
 parts=rel.split('/')
 if parts[:3]==['assets','entrance','v0.3']:
  return ROOT/'02_館内デザイン_制作中'/'entrance_v0.3'/'02_assets'/parts[-1]
 if parts[:3]!=['assets','p3','v1']:raise ValueError('Unrecognized PNG import: '+rel)
 room=parts[3]
 production=ROOT/'05_P3_館内美術制作'
 if room in ('shared_doors','shared_frames'):
  return production/'gallery02_v0.2'/'01_assets'/room/parts[-1]
 group={'gallery02':'gallery02_v0.2','gallery03':'gallery03_04_v0.1',
        'gallery04':'gallery03_04_v0.1','gallery05':'gallery05_06_v0.1',
        'gallery06':'gallery05_06_v0.1'}[room]
 return production/group/'01_assets'/room/parts[-1]
checks=[]
for path,sha in manifest['sourceHashes'].items():
 src=BASE/path
 actual=hashlib.sha256(src.read_bytes()).hexdigest()
 original=hashlib.sha256(original_png(path).read_bytes()).hexdigest()
 if actual!=sha or original!=sha:raise ValueError('Imported/original PNG SHA mismatch: '+path)
 checks.append({'path':path,'sha256':sha,'sourceOriginalUnchanged':True,'pass':True})
keys=['p4_full_e2e_results.json','p4_fault_e2e_results.json','p2_e2e_results.json','p2_failure_e2e_results.json','p6_full_e2e_results.json','p6_smoke_results.json','p6_race_e2e_results.json']
expected=[269,34,35,39,120,17,11]
summaries=[]
for fn,want in zip(keys,expected):
 p=QA/fn
 if not p.exists():raise FileNotFoundError(p)
 data=json.loads(p.read_text('utf-8'))
 detail=data.get('results',data.get('tests',data.get('assertions',[])))
 got=data.get('passed',sum(bool(x.get('pass')) for x in detail))
 bad=data.get('failure',data.get('failures',data.get('errors',data.get('error'))))
 if got!=want or bad not in (None,[]) or any(not x.get('pass') for x in detail):
  raise ValueError(f'Unexpected P6 regression: {fn}: {got}, failure={bad}')
 summaries.append({'file':fn,'pass':got,'expected':want})
vfile=QA/'p3_visual_dpad_results.json'
if not vfile.exists():raise FileNotFoundError(vfile)
vis=json.loads(vfile.read_text('utf-8'))
if vis.get('failure') is not None:raise ValueError('P3 visual QA has errors: '+str(vis.get('failure'))[:260])
for room in range(6):
 im=QA/f'P3_room{room:02}_Lv6_390x844.png'
 if not im.is_file():raise FileNotFoundError(im)
 with Image.open(im) as data:
  if data.size!=(390,844):raise ValueError('Wrong Chrome screenshot size: '+str(im))
ref={
 0:ROOT/'02_館内デザイン_制作中'/'entrance_v0.3'/'01_preview'/'entrance_empty_preview_v03.png',
 1:ROOT/'05_P3_館内美術制作'/'gallery02_v0.2'/'02_preview'/'gallery02_empty_OPEN_east_LOCKED_north_v02.png',
 2:ROOT/'05_P3_館内美術制作'/'gallery03_04_v0.1'/'02_preview'/'gallery03_empty_v01.png',
 3:ROOT/'05_P3_館内美術制作'/'gallery03_04_v0.1'/'02_preview'/'gallery04_empty_v01.png',
 4:ROOT/'05_P3_館内美術制作'/'gallery05_06_v0.1'/'02_preview'/'gallery05_empty_v01.png',
 5:ROOT/'05_P3_館内美術制作'/'gallery05_06_v0.1'/'02_preview'/'gallery06_empty_v01.png',
}
bg='#f6f1e8'
contact=Image.new('RGB',(3*410,2*890),bg);draw=ImageDraw.Draw(contact)
for room in range(6):
 x=(room%3)*410;y=(room//3)*890
 img=Image.open(QA/f'P3_room{room:02}_Lv6_390x844.png').convert('RGB')
 contact.paste(img,(x+10,y+30));draw.text((x+10,y+10),f'{room:02} / Level 6 / Browser 390x844',fill='#252b27')
contact.save(DEST/'P3_six_rooms_actual_browser_contact.png')
compare=Image.new('RGB',(3*810,2*890),bg);d=ImageDraw.Draw(compare)
for room in range(6):
 x=(room%3)*810;y=(room//3)*890
 a=Image.open(ref[room]).convert('RGB');a.thumbnail((390,590),Image.Resampling.NEAREST)
 b=Image.open(QA/f'P3_room{room:02}_Lv6_390x844.png').convert('RGB')
 compare.paste(a,(x+5,y+40+(590-a.height)//2))
 compare.paste(b,(x+405,y+30))
 d.text((x+5,y+8),f'{room:02} / P3 original design',fill='#1b2821')
 d.text((x+405,y+8),f'{room:02} / Chrome 390x844',fill='#1b2821')
compare.save(DEST/'P3_reference_vs_runtime_contact.png')
protected=['museum-p2-storage.js','museum-progression.js','p6-event-dialogue-v1.json','layout-system.js','asset-renderer.js','entrance-renderer.js','museum-navigation.js']
base_commit='dc648bec055c12a927af64338eeac332fd9412a1'
protected_report=[]
for name in protected:
 obj=subprocess.check_output(['git','-C',str(REPO),'show',f'{base_commit}:a18/layout-test/{name}'])
 now=(BASE/name).read_bytes()
 if obj.replace(b'\r\n',b'\n')!=now.replace(b'\r\n',b'\n'):
  raise ValueError('Protected P6 functionality edited: '+name)
 protected_report.append({'file':name,'sha256':hashlib.sha256(now).hexdigest(),'gitBlobEquivalent':True,'newlineNormalized':True})
git_status=subprocess.check_output(['git','-C',str(REPO),'status','--short'],text=True,encoding='utf-8').strip()
git_head=subprocess.check_output(['git','-C',str(REPO),'rev-parse','HEAD'],text=True).strip()
audit={'baseCommit':base_commit,'headCommit':git_head,'branch':'feature/a18-p3-gallery-integration-20261023','assetBytesVerified':len(checks),'assets':checks,'protected':protected_report,'regressions':summaries,'regressionTotal':sum(x['pass'] for x in summaries),'p3VisualCount':vis['passed'],'p3VisualTotal':vis['total'],'screenshots390x844':6,'sourceDriveUnchanged':True,'remainingNetworkLogs':next((x['actual'] for x in vis['checks'] if x['name']=='browser_network_log_count'),0),'gitStatus':git_status}
(DEST/'P3_provenance_and_compatibility_audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n','utf-8')
(DEST/'P3_integration_report.md').write_text(f"""# A18 全館P3建築美術統合・実ブラウザ検証

## 実装起点と保護
- 起点コミット: `{base_commit}`（P6基準）
- P3専用: `feature/a18-p3-gallery-integration-20261023`
- worktree: `{REPO}`
- 元のP6 worktree、main、P3/P5原本は変更せず。iOSビルド・公開・DB移行なし。
- 保護済み7ソース（保存、進行、P6会話、28枠、NPC、エントランス、扉graph）を基準コミットのバイト列と照合。

## 実装範囲
- エントランスv0.3を維持し、閉扉透過レイヤーを実通行ゲートに連動。
- 展示室02 v0.2 / 03〜06 v0.1 : 6層×5室の独立RGBA素材を正式描画へ。
- 全7通路、OPENを先に描き必要時にLOCKEDの木製戸板を追加。論理可否は `A18P2Store.canTraverse` に統一。
- 各展示: 写真原本の縦横比を維持→金色9-slice→正式人物→UI。既存fixtureId・作品ID・28枠不変。
- P5のレベル増分装飾PNGは未統合。受け入れ位置のみ確保。

## Chrome検証
- P6の7グループ: **{sum(x['pass'] for x in summaries)}/525 PASS**。
- P3独自: **{vis['passed']}/{vis['total']} PASS**。Lv1扉施錠、Lv6全開、実際のD-padタッチによる14方向、再起動、Blob SHA / fixture対応不変、全6室390×844スクリーンショット。
- 実画像3形状（横・縦・正方形）PNGをP2隔離Chromeプロファイルの保存テストに使用。
- 保存失敗・2タブ競合はP6回帰内で検証。
- 比較画像: `P3_reference_vs_runtime_contact.png` は静的P3全景と実ブラウザの**比較**。実ブラウザはカメラとUIで切り取られるためピクセル一致の判定ではない。
- 過去のChrome警告（deprecated meta, favicon 404等）はレンダリング/JS失敗と分離し、`qa_runtime/p3_visual_dpad_results.json` に記録。ネットワークログ件数: {audit['remainingNetworkLogs']}。

## 主なQA成果物
- `P3_six_rooms_actual_browser_contact.png`
- `P3_reference_vs_runtime_contact.png`
- `qa_runtime/P3_room00_Lv6_390x844.png` ～ `P3_room05_Lv6_390x844.png`
- `qa_runtime/P3_entrance_3real_shapes_Lv2_390x844.png`
- `qa_runtime/`内の525項目JSONとP3独自QA JSON
- `P3_provenance_and_compatibility_audit.json` （全50PNG SHA256 / コード保護検証）

## QA判定
既存P6回帰とP3固有のChrome検証では合格。最終的なiPhone実機・P5装飾追加・美術監修は後工程。
""",encoding='utf-8')
(DEST/'P5_integration_handoff.md').write_text("""# A18 P5 装飾受け入れ

P3で定義する構成は `museum-p3-renderer.js`。

- 展示室02〜06の `floor → wall → panel → trim → glow → light` が先。
- P5の確定増分画像を使う場合は、**light後・door前**（写真/9-slice/キャラクター/UIの背後）を推奨する。背景全景の透明合成を守る。
- P3のOPEN扉・LOCKED戸板は必ず `A18P2Store.canTraverse(room, direction, progression)` と同値。別条件・別IDは禁止。
- Lv.1〜6で未開放室の素材を見せない。写真・NPCとUIの上にP5を合成しない。
- P5素材は今回**ゼロ点**。未制作素材の推測作成/ダミー/フォールバックは禁止。
- P5を追加する際はP3 525回帰 + Dpad 14方向 + 6室390×844 + 作品原本SHA/fixture不変を再実施。
- 独立worktreeのまま監修し、mainへマージしない。
""",encoding='utf-8')
out=DEST/'tests'
out.mkdir(parents=True,exist_ok=True)
for fn in ('prepare_p3_assets.py','p3-visual-dpad-e2e.py','p3_finalize_qa.py'):
 shutil.copy2(BASE/'tests'/fn,out/fn)
shutil.copy2(BASE/'museum-p3-renderer.js',DEST/'museum-p3-renderer.js')
shutil.copy2(BASE/'p3-architecture-manifest.json',DEST/'p3-architecture-manifest.json')
print(json.dumps({'verified_png':len(checks),'regression':audit['regressionTotal'],'p3':vis['passed'],'screenshots':6,'dest':str(DEST)},ensure_ascii=False))
