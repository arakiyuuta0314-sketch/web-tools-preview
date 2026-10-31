# A18｜展示室2北側扉を展示室1の意匠に統一（2026-10-31）

## ユーザー依頼・実際の画像確認
- 展示室2の北側通路は、修正前の深緑のアーチ開口のみで、展示室1北側の木製アーチ＋両開き扉と異なっていた。
- 実際の採用済みゲーム画像 `gallery1_game_589x482.png`、`gallery2_game_589x482.png`、承認済み930×582原本を確認して作業。
- 展示室1の**実物の木製装飾アーチと両開き扉**を、同じピクセルスケールで展示室2の北側へ転用した。色や造形をAI生成で作り直していない。
- 重複する旧アーチは、隣接する展示室2の壁材と腰壁材で局所的に復元してから合成。継ぎ目は外周5pxでなじませ、元のアーチが二重に残らないようにした。

## 変更・維持
- 変更した実表示素材：`assets/approved-galleries/gallery2_game_589x482.png` **のみ**。該当北扉周辺（ゲーム画像の x419〜516、y10〜140）外の画素は完全一致。変更11,562px。
- `tests/build_approved_gallery_game_assets.py` に同一生成手順を追加。開発済みの展示室1ゲーム用画像から決定的に再生成できる。
- `approved-gallery-manifest.json` は展示室2派生画像のSHA256のみ更新。展示室1〜5の承認原本／独立展示壁／他の派生ゲーム画像は変更なし。
- モバイルブラウザの古い展示室2画像キャッシュを回避するため、`museum-p3-renderer.js` の展示室2画像URLと `index.html` のP3スクリプト読み込みだけに新バージョン指定。
- **変更しないもの**：展示室2の四角い黒枠／左上西通路／出現位置(58,239)／北通路（展示室4への移動）／当たり判定／額縁やスタッフ／物語・写真・館レベル。

## QA実績
- `tests/gallery2_north_door_regression.py`：展示室1の実木製扉の対応画素が展示室2へ移植されていること、他の画像部分は画素完全一致、承認原本SHA256、既存黒枠と左通路の維持。
- `tests/gallery2_framing_regression.py`：既存黒枠・通路を維持。
- **正規再生成テスト**：承認済み原本から隔離TEMP内で全5展示室のゲーム用画像を再生成。全5枚がmanifestのSHA256と完全一致し、元画像は書き換えていない。
- `tests/approved_portals_and_wall_collisions.js`：6室14方向の移動・到着座標・壁／額縁／スタッフの衝突。
- `fixed-museum-level-regression.js`、`gallery5-test-level-regression.js`、`gallery-room-labels-regression.js`、`frame-restore-regression.js`：既存回帰テストPASS。
- `tests/gallery2_north_door_browser_e2e.py`：Chrome 844×390 / 390×844 の実ゲームに展示室2画像が描画され、判定表示ON/OFFの画像を取得。スマホは扉が画面に収まる位置へ移動した `gallery2_northdoor_mobile_focused_390.png` も記録。
- `tests/actual_door_crossings_e2e.py`：PC/スマホで14方向の実歩行移動成功。
- `tests/presentation_level_real_game_e2e.py`：Lv6設定とストーリー独立、14方向の移動、保存・読込に問題なし。
- 視覚的な比較：`tests/gallery2-northdoor-qa/door_design_comparison.png`（修正前／修正後／展示室1の正本）。

## Gitと公開範囲
- 開発repo `web-tools-preview` の既存 `work/a18-gallery1-layout-concepts-20261028` 上で実装・QA。workからissueまたはmainへ無断マージしない。
- 今回のユーザー指示は「扉を修正して再接続」なので、**正式ゲームPagesの公開リポジトリ `a18-totteoki-museum` は未更新**。公開指示があれば対象実行ファイルと画像だけをwork→issue→PR→mainの経路で検証して反映する。
