# A18 エントランス正式採用初期背景｜ゲーム統合QA（2026-10-27）

## 目的・起点
- ユーザーが「エントランスの初期素材」と承認し、Google DriveとGitへ登録した正本のみをゲームへ反映。
- 実物: `a18/layout-test/assets/entrance/approved_initial_20261027/entrance_background_initial_approved.png`（1322×1190、SHA-256 `cc4bca9821242facbee3984d1df7034514845195205c2b30cc94ef4628a469cf`）。
- 編集ブランチ: `feature/a18-entrance-clean-redraw-20261027`、起点 `abdb8592611e3f745b52a38193b5d1f4d88d8949`。本番`main`と別。
- 採用済み建物の再生成や照明・額縁・カウンター・仕切り・絨毯・家具の焼き込みはしていない。原本のPNGは変更なし。

## 実装
- `a18/layout-test/entrance-renderer.js`: 背景画像を正式採用PNGへ変更。546×483のゲーム座標には**アスペクト比を維持する上下中央クロップ**で描画。元画像の幅1322を全面使用、高さ約1170を使用し、縦方向を伸縮させない。
- 背面の写真を展示するときの下地再描画も採用済み背景の同一座標から切り出すよう変更（旧v10下地の混入を回避）。
- `a18/layout-test/index.html` の読み込みキャッシュ版を更新。外部の写真、保存スキーマ、登録データ、キャラクター画像、進行ルールは変更していない。
- 初期背景は当初の合意どおり家具・装飾がない状態。前景素材3点は今回の対象外。

## 実機代替 QA（隔離Chrome・新規ユーザーデータディレクトリ）
- `node a18/qa-clean-redraw-20261027/qa-approved-initial-browser.cjs`：背景ロード1322×1190、描画546×483、JS例外0、通信失敗0、PASS。
- `node a18/qa-clean-redraw-20261027/qa-approved-initial-gameplay.cjs`：初回イベント→館長名・性別・館名保存→イベント終了→左移動（x326→314）→自動保存→再読込復元、PASS。
- Portrait 390×844 / Landscape 844×390、両方のスクリーンショットを同ディレクトリに保存。
- `node a18/layout-test/tests/fixed-museum-level-regression.js` PASS
- `node a18/layout-test/tests/frame-orientation-regression.js` PASS（全28枠）
- `node a18/layout-test/tests/frame-restore-regression.js` PASS
- `node --check a18/layout-test/entrance-renderer.js` PASS

## 既知の未完了（**ゲーム完成扱いにしない**）
- カウンター・左中間仕切り壁・右中間仕切り壁（正面姿勢で制作し、ゲーム側で回転／射影する独立前景）3点は未制作・未描画。
- そのため、旧座標に基づく当たり判定（旧カウンター・左右仕切り位置）と、旧3展示位置のうち右手前枠の表示・鑑賞条件は再調整が必要。**作品・保存データを勝手に削除・移行しない**。
- 既存の総合スモーク `tests/layout-smoke.html` は旧テストの初回登録完了待ち不足で `initial setup saves name gender` 失敗。専用QAでは保存とリロードを待って成功確認済み。総合スモークの修理は別課題。全館完全回帰の証拠にはしない。
- この成果は開発用ブランチの**ゲームに実装済み**。ユーザーが見ている公開試遊リンクへのデプロイおよび`main`統合は未実施。

## 証跡
- `approved-initial-gameplay-landscape-844x390.png`
- `approved-initial-gameplay-portrait-390x844.png`
- `approved-initial-browser-render-546x483.png`
- `approved-initial-browser-results.json`
- `approved-initial-gameplay-results.json`
