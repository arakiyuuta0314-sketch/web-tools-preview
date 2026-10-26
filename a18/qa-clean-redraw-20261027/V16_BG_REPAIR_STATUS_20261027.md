# A18 エントランス背景画質改善 v16（監修用・未採用）

## 正式基準を維持した内容

- 原型：既存公開 v10 の `layout-test/assets/entrance/v09/entrance_architecture_v10.png` (546×483)。
- 原型の建築配置・中央扉・背面展示面・右手前展示面・左受付・壁の斜め角度は変更しない。
- 元画像を FSRCNN x4 で2184×1932へ拡大し、床面のみに承認済み高解像度原画 `art-sources/entrance_clean_redraw_master_20261027.png` 由来の床目地・反射テクスチャを境界マスクで適用。
- 壁・柱・右手前展示壁・中央扉・受付の塗り直しなし。低解像度版の未知のディテールを元に戻せたという意味ではない。
- 既存展示位置・写真窓マスク・透視変換と保存形式は、公開 v10 のコードを使い維持。
- 修正版は `layout-test/assets/entrance/v16/entrance_background_clean_v16_2184x1932.png`。ゲーム試験ブランチの `entrance-renderer.js` に限り参照先と高画質縮小描画を変更。

## 完了検証

- 入力原本のチェックサム記録：`v16-background-quality-report.json`。
- マスクQA：床以外の変更画素0、背面壁・扉・展示壁の配置を固定、床適用画素1,411,659（4倍解像度）。
- ブラウザQA：隔離Chrome 390×844 DPR2、アセット6点ロード、背景2184×1932、右手前展示窓 geometry=(421,195,73,131)、起動時JS例外0、ネットワークエラー0。`v16-browser-quality-results.json` を参照。
- Node純粋テスト：frame-orientation / frame-restore / fixed-museum-level にてPASS。
- 旧 `tests/run-browser-regression.py` は初期設定「name gender」検査でFAIL。ブラウザ診断で読み込み対象が undefined となり、背景描画を検証できるテストではなかった。完全な全館回帰の合格扱いはしない。

## 監修とGit境界

- 元の `v09 OFF` の構図を基準とし、棄却された v11/v12/v13 の背景・射影は正式採用しない。
- 監修資料：`v16-before-after-mobile-vertical.png`、`v16-browser-render-background-546x483.png`、`v16-browser-mobile-390x844.png`。
- この成果は既存 `feature/a18-entrance-clean-redraw-20261027` 内の **試験候補**。ユーザー監修まで `main` およびWeb公開Pagesへ反映しない。
- 本画像の超解像は新規細部を厳密復元する方法ではなく、品質改善候補。既存とは違う建築にしてしまう画像生成より形状再現を優先した。
