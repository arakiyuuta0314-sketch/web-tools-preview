# A18 エントランス｜執事背面通行修正（2026-10-27）

## ユーザーからの追加指示
「執事の当たり判定が大きい。後ろが通れないので調整して。」

## 問題の実態
従前は`npcBounds('butler',0)`をそのまま物理障害物にしており、約x123.2〜154.1 / y317.4〜366（**全身49px**）を不可侵にしたため、背中側の通路で動きが止まった。

## 修正
- `layout-system.js`部屋0の物理判定を **執事足元の長方形 x129〜149 / y361〜368** に縮小。
- スプライトの描画・執事の位置は変更しない。従来の話しかけるアンカーは別概念として維持。
- `index.html`描画順のみ微修正。館長の立ち位置`pos.y<366`の場合は執事より先に描き、実際に後ろにいるよう表示。手前の描画順は従来どおり。
- 奥壁・額縁調べる判定2つ・エリア移動禁止・他室の判定・写真保存・美術素材は変更しない。

## QA実施結果
- `node a18/layout-test/tests/entrance-collision-rebuild-regression.js` PASS。後方ルートx90..192, y335が全て可、執事の足元x139,y360は不可、奥壁は不可。
- `node a18/qa-clean-redraw-20261027/qa-butler-foot-v2.cjs` PASS（隔離Chrome）。実歩行で執事の背面y329をx122→146に横断、2つの額縁・既存出口移動の無効化・保存・再読み込みを検査。
- 背後通過の実ブラウザ画像 `butler-foot-v2-behind-butler-390x844.png` を確認。館長の頭に執事が前景として重なる深度表現を確認。
- `fixed-museum-level-regression.js`、`frame-restore-regression.js`、`frame-orientation-regression.js` PASS。
- JS例外0・通信失敗0。未実施：実iPhone Safariの指操作によるQA。

## Git運用
- `web-tools-preview`既存の安全な `feature/a18-entrance-clean-redraw-20261027`を利用し開発する。ベース `a9efdbb`。
- 公開は**別リポジトリ**`a18-totteoki-museum-pages`で、公開側の既存ランタイム差分と一致を確認してから行う。
- 旧材質や保存データ・画像の正本を上書きしない。
