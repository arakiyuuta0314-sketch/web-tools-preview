# A18 エントランス背景 v16｜画質改善候補・試遊比較（2026-10-27）

## 改善候補
- 元画像正本は `a18/layout-test/assets/entrance/v09/entrance_architecture_v10.png`（546x483）。右手前斜め壁、柱、扉、展示位置を固定。
- 新候補 `a18/layout-test/assets/entrance/v16/entrance_background_clean_v16_2184x1932.png`（2184x1932）。元画像を超解像し、床にv11高解像度原画の目地・質感を部分反映。壁の位置は不変。
- 作品・写真・額縁・電灯を新背景に新規焼き込みしていない。保存データの変換・書き換えなし。
- `a18/layout-test/entrance-renderer.js` で背景だけ縮小描画。額縁と写真マスクはv10原配置を保持。
- 元画像の不鮮明な情報を完全に復元できたわけではない。右手前壁の細部は残課題。**正式素材採用はユーザー監修待ち。**

## 検証
- `a18/qa-clean-redraw-20261027/qa-v16-browser.cjs`：隔離Chrome 390x844、v16読み込み2184x1932、assetCount=6、前景枠基準x421/y195、例外0、通信失敗0、PASS。
- `node a18/layout-test/tests/frame-orientation-regression.js`：全28枠PASS。
- `node a18/layout-test/tests/frame-restore-regression.js`：27枠自動復元と1枠編集保存をPASS。
- `node a18/layout-test/tests/fixed-museum-level-regression.js`：展示室・レベル・スタッフ会話をPASS。
- 全6室の最終通しQA・iPhone実機検証はこの成果だけでは未実施。ゲームのmainおよび正式Web試遊版は更新していない。

## スマホ比較版（先にQA済み）
https://arakiyuuta0314-sketch.github.io/a18-art-previews/entrance-v16-quality-preview-20261027/

- a18-art-previews `main` に画質の比較ページだけを正式公開済み（公開用commit: `47a0c4e0629538088f0672291ffb3de2582b8735`）。
- この比較の公開は**ゲームへの採用・統合を意味しない**。
- Chrome 390x844 / DPR2 で画像ロード、スライダー、幅・例外・通信を検証。公開HTML／WebPのHTTP 200確認。
- 採用判断後に対象ゲームブランチからmainへ所定のQAを経て統合する。未採用のv11/v12/v13差し替え案は統合しない。

## Git・整理
- 開発ブランチ：`feature/a18-entrance-clean-redraw-20261027` を継続利用。別目的worktreeは変更しない。
- 既存未追跡の試験生成物は他作業と混同せず保持。誤ってmainへ混入させない。
