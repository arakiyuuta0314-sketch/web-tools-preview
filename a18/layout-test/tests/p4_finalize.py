"""Prepare and verify P4 handoff materials from real git and Chrome outputs."""
from pathlib import Path
import json, shutil, subprocess, hashlib, struct
here=Path(__file__).resolve().parents[1]
repo=here.parents[1]
target=Path(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\08_P4_Lv3-Lv6実装')
target.mkdir(parents=True,exist_ok=True)
def git(*args):
 return subprocess.check_output(['git',*args],cwd=repo,stderr=subprocess.STDOUT).decode('utf-8',errors='replace').strip()
head=git('rev-parse','HEAD')
parent=git('rev-parse','HEAD^')
branch=git('branch','--show-current')
assert branch=='feature/a18-p4-lv3-lv6-20261023'
assert parent=='3bfdcb23a2d54d152de47040d42e727335fe5803'
files=git('diff-tree','--no-commit-id','--name-only','-r','HEAD').splitlines()
assert files and all(f.startswith('a18/layout-test/') for f in files)
assert not git('status','--porcelain'),git('status','--porcelain')
m=json.loads((target/'p2_e2e_results.json').read_text('utf-8'))
f=json.loads((target/'p2_failure_e2e_results.json').read_text('utf-8'))
full=json.loads((target/'p4_full_e2e_results.json').read_text('utf-8'))
fault=json.loads((target/'p4_fault_e2e_results.json').read_text('utf-8'))
assert m['passed']==35 and m['failure'] is None
assert len(f['tests'])==39 and f['failures']==[]
assert full['passed']==269 and full['failure'] is None
assert fault['passed']==34 and fault['failures']==[]
count=35+39+269+34
images=sorted(target.glob('*.png'))
assert len(images)>=15,len(images)
dimensions={}
for p in images:
 b=p.read_bytes()
 assert b[:8]==b'\x89PNG\r\n\x1a\n',p
 size=struct.unpack('>II',b[16:24])
 assert size==(390,844),(p.name,size)
 dimensions[p.name]=list(size)
p6=target.parent/'06_P6_ストーリー先行制作'/'A18_P6_イベント台本データ_v1.0_20261023.json'
copied=here/'p6-event-dialogue-v1.json'
assert p6.read_bytes()==copied.read_bytes()
tests=['p4-full-e2e.py','p4-fault-e2e.py','p4-p2-regression-e2e.py','p4-p2-fault-regression-e2e.py','p4_apply.py','p4_prepare_tests.py','p4_finalize.py']
(target/'tests').mkdir(exist_ok=True)
for file in tests:
 shutil.copy2(here/'tests'/file,target/'tests'/file)
 assert (target/'tests'/file).read_bytes()==(here/'tests'/file).read_bytes()
(target/'p4_git_commit.patch').write_text(git('format-patch','-1','--stdout')+'\n',encoding='utf-8')
sha=lambda b:hashlib.sha256(b).hexdigest()
hashes={p.name:sha(p.read_bytes()) for p in images}
for n in ['p2_e2e_results.json','p2_failure_e2e_results.json','p4_full_e2e_results.json','p4_fault_e2e_results.json']:
 hashes[n]=sha((target/n).read_bytes())
hashes['p6-event-dialogue-v1.json']=sha(copied.read_bytes())
(target/'p4_verified_assets.json').write_text(json.dumps({'screenshots':dimensions,'sha256':hashes,'gitBranch':branch,'gitCommit':head,'gitParent':parent,'changedFiles':files,'testCounts':[35,39,269,34],'totalPass':count},ensure_ascii=False,indent=2),encoding='utf-8')
def doc(filename,content):
 path=target/filename
 path.write_text(content.strip()+'\n',encoding='utf-8')
 assert len(path.read_text('utf-8'))>100
doc('00_README_P4_監修向け成果物一覧_20261023.md',f"""
# P4「とっておき美術館」監修向け成果物一覧
2026-10-23。P4専用worktreeでコミット済、監修審査待ち。

## 結果
Chrome E2E **{count} PASS／0 FAIL**。P4新規269、追加障害34、P2回帰74。
28枠の通し展示、6イベント、7通路14方向、原本Blob比較、NEW通知維持を確認。
全て合成PNGとChrome一時プロファイルによる検証。旧v2実データ使用なし。

## 成果物
- 01_P4_実装報告・Git変更一覧_20261023.md：ブランチ・コミット・変更ファイル。
- 02_P4_実ブラウザ試験結果_20261023.md：Chrome実行・再現コマンド・合否。
- 03_P4_原子保存・障害・旧データ保護_20261023.md：CAS、Blob、故障、隔離。
- 04_P4_未決事項・次工程引き継ぎ_20261023.md：監修決裁・P1 A/Bとの整合。
- 05_P4_スクリーンショットQA_20261023.md：実画面PNG一覧・限界。
- p4_full_e2e_results.json と p4_fault_e2e_results.json：P4アサーション。
- p2_e2e_results.json と p2_failure_e2e_results.json：P2回帰証跡。
- tests フォルダ：再実行可能なChrome CDP試験コードと作業スクリプト。
- PNG計{len(images)}枚：390×844の実ブラウザ画面。
- p4_verified_assets.json：スクリーンショット寸法・SHA-256・Git・件数。
- p4_git_commit.patch：確定Gitパッチ。

P3美術素材、main、GitHub Pages、iOS、App Storeは操作対象外。
""")
doc('01_P4_実装報告・Git変更一覧_20261023.md',f"""
# P4 実装報告・Git差分
日付 2026-10-23
Worktree: C:/Users/User/source/repos/web-tools-preview-a18-p4
ブランチ: {branch}
P2基準: {parent}
確定コミット: {head}
Git確認時ワークツリー clean。main未マージ。

## 変更ファイル
"""+'\n'.join('- '+name for name in files)+"""

## 変更機能
museum-p2-storage.js：攻略フロンティアroom0→5の初回未満額から満額への遷移でawardedRoomIdsに一回授与。room0..4でLv2..6へ進み、room5で最大Lv6を維持しgallery06-complete-v1を追加。P2のv3 schema、revision CAS、Blobを含む単一トランザクションは維持。
index.html：P6 JSON実読込・ID/バージョン整合チェック。Lv2〜6のqueuedイベントUIを共通化して読了/後で読むをCAS保存、起動時queuedなら復元。gallery06完了は監修待ちとして中立的な仮UIのみ。
museum-navigation.js：既存newRoomNoticesを館内図のNEW表示に反映。自動消去なし。
p6-event-dialogue-v1.json：元P6 JSONをバイト同一コピー。原本への書込み・未承認の台詞改変なし。
tests：P2回帰74項目保持、P4新規303項目。実ファイル入力・通常CRUD・全館進行・レベルイベント・故障を網羅。
""")
doc('02_P4_実ブラウザ試験結果_20261023.md',f"""
# P4 Chrome実測試験
環境：HP-600G4-SFF、Chrome headless＋CDP、390×844モバイル。
配信起点：P4 worktreeのa18ディレクトリ、127.0.0.1:8894。
全試験は一時Chromeユーザープロファイル、P2隔離専用schema3 DBを利用。

| 組 | PASS | FAIL |
|---|---:|---:|
| P4 28枠・Lv1〜6全館通し | 269 | 0 |
| P4 最終枠障害・2タブ・未開放室復元 | 34 | 0 |
| P2メイン回帰 | 35 | 0 |
| P2障害・操作回帰 | 39 | 0 |
| 合計 | {count} | 0 |

## 合格シナリオ
- Lv1入口3/3でLv2、Lv2 room1 5/5でLv3、以降room2→Lv4、room3→Lv5、room4→Lv6。
- Lv6 room5 5/5でLv6のまま最終授与、gallery06-complete-v1初回のみ発生。
- 開放済の有向通路を全14方向ゲームchangeScene関数から実際に遷移・往復し、CAS保存。レベル別通路数0/1/2/3/4/7。
- 未開放室への直接遷移を拒否、位置を保持。異常セーブによる不正復元はE_ROOM_LOCKEDでfail-fast。
- 各レベルで新規イベントqueued、再起動時提示、読了後seen、スキップでavailable。NEWは初入室後も維持。
- Lv6達成後、持上げ・交換・保管・削除・再起動によってレベル/授与履歴/イベント一意性が失われない。
- 各レベルで保存前後の原本Blob SHA-256、作品ID、備考、元日付、画像設定、fixtureId、全設備の復元一致。
- P2既存74チェック全PASS、競合で旧revision拒否、失敗後データ維持を確認。
- P4全館Chrome Runtime.exceptionThrown 0（意図的な障害時は捕捉済console errorあり）。

## 再試験コマンド
P4 worktreeのa18ディレクトリで、python -m http.server 8894 --bind 127.0.0.1 を実行。
別シェルでa18/layout-testに移動し、
python tests/p4-full-e2e.py
python tests/p4-fault-e2e.py
python tests/p4-p2-regression-e2e.py
python tests/p4-p2-fault-regression-e2e.py
を個別実行。

## 未検証
iPhone実機・320/375px・各扉D-pad実歩行の全組合せ・OS実容量不足・強制プロセスkill境界は未実施。
全通路の往復は画面に接続されたchangeScene APIからの検証であり、全扉をD-padで実踏破した証明ではない。
""")
doc('03_P4_原子保存・障害・旧データ保護_20261023.md',"""
# P4 原子保存・競合・データ保護
## v3専用DB
a18-museum-p2-isolated-v3、states/museum、schemaVersion3、revision CAS。旧DB a18-museum-layout-v2の読込・書込・消去・初期化をしない。テストは全て隔離プロファイル。

## 原子保存
Lv6で27展示＋28件目が手持ちという確定レコードを採取し、最終展示にtx abort注入。
最終授与・イベント・枠配置がいずれも記録されず、revision・全fixtures/works・進行・原本Blobハッシュ・メタ情報が保存前レコードと完全一致。
失敗画面は停止案内。再起動後に手持ち作品を復元し、再展示して初めて最終授与が成立。Lv7なし。

## 2タブ
Lv6最終達成後の物理Chrome2タブ同revisionからタブAを先行コミット、BはE_SAVE_CONFLICTで拒否。Bの作品は書込まれず、Lv6のawardedRoomIdsと作品が保たれた。P2側の2タブ試験も回帰PASS。

## 不正復元
試験専用隔離DBへ人工的にLv1・galleryIndex5の不整合を注入した場合、起動はE_ROOM_LOCKEDでfail-fast、値を自動修復しない。Lv7候補もvalidator拒否。

## データ同一性
28作品についてoriginalBlob全バイトSHA-256比較に加え、ID、備考、タイトル、日付、ピース、preferredShape、fixtureId、thumbnail、displaySrc、Blob size/type、設備情報も再起動後まで比較。
QuotaExceededErrorはP2故障注入回帰で確認。実OSストレージ枯渇・kill瞬間の耐久は未実施。

## 移行未承認境界
旧v2セーブのA/B方式は未選択。P1に従い旧データを勝手に移行せず、v3の合成作品だけで検証。旧版を黙って初期化・削除・旧版へのフォールバックしない。
""")
doc('04_P4_未決事項・次工程引き継ぎ_20261023.md',f"""
# P4 未決事項・引き継ぎ
## 監修判断待ち
1. 旧v2保存移行 A/B と保存方式 S1/S2、旧版バックアップと競合の最終採否。
2. NEW消費のタイミング：現在は配列を保持・表示するだけ。初入室や館内図閉鎖で勝手に消していない。
3. gallery06-complete-v1の正式演出・記念文面・報酬（P6の最終台本はtext_pending_approval）。Lv7導入はしない。
4. intro-v1本編導入、各イベントの再読画面、イベント中断時の完成UX。P4は既存onboardingとLv2〜6仮UIを継承。
5. P3正式館内美術・扉素材統合。P4はP3フォルダには書込まず、現行土台で検証。
6. 保存失敗時の安全な再試行導線とiPhone12実機／320,375px／長時間／D-pad扉全動線試験。

## 旧v2移行への引継要件
P1の方式A：旧利用者は6室開放継続。方式B：旧レベル・既展示最奥・現在地根拠から連続開放、既満額frontierは移行中に調停。どちらも原本Blob、ID、設備、写真表示、備考、位置・持ち運びを無断改変しない。
保存S1：同一DB backup＋v3切替を1txとするが旧タブ混在に課題。
保存S2：旧v2別DB保持＋v3側独立、DB横断の一原子txは不可。どちらも未承認。旧版への書込み・削除を先行しない。

## ソース起点
{branch}, commit {head}
C:/Users/User/source/repos/web-tools-preview-a18-p4
mainマージ、GitHub Pages、iOSビルド、App Store提出は禁止のまま。
""")
doc('05_P4_スクリーンショットQA_20261023.md',f"""
# P4 実画面スクリーンショットQA
実測Chrome mobile=390×844、PNG {len(images)} 枚。
全画像がPNG署名、390×844ヘッダーを備えることを再検算済。
目視確認：P4_Lv4_event_lv4-v1_390x844.png は展示室04解放と女性スタッフ仮イベントを表示。
P4_Lv6_28frames_final_390x844.png は展示室06、Lv6、展示5/5、所蔵28/30を表示。
合成作品は極小PNGなので作品そのものの美術品質は判断しない。

## PNG一覧
"""+'\n'.join('- '+p.name for p in images)+"""
P3美術の最終表示、iPhone実機、フルデータ画像描画は別工程。
""")
report=['00_README_P4_監修向け成果物一覧_20261023.md','01_P4_実装報告・Git変更一覧_20261023.md','02_P4_実ブラウザ試験結果_20261023.md','03_P4_原子保存・障害・旧データ保護_20261023.md','04_P4_未決事項・次工程引き継ぎ_20261023.md','05_P4_スクリーンショットQA_20261023.md']
assert all((target/f).exists() for f in report)
assert json.loads((target/'p4_verified_assets.json').read_text('utf-8'))['totalPass']==count
print(json.dumps({'commit':head,'branch':branch,'totalPass':count,'png':len(images),'reports':report,'changed':files},ensure_ascii=False))
