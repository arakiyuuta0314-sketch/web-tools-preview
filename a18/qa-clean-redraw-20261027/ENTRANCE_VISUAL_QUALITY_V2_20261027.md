# A18 エントランス表示品質修正 v2（2026-10-27）

## 相談内容
iPhoneでの基本操作はOK。一方、①画像のちらつき ②画質が悪い ③画像のサイズが違和感、を確認・修正する。承認済みの背景画像・描画位置・キャラクター・写真・保存データを勝手に改変しない。

## 調査で確認した事実（隔離Chrome、iPhone12相当 390×844）
- 起点: `feature/a18-entrance-clean-redraw-20261027` / `908ebc7`。
- iPhone縦画面CSS: stage 390×793、canvas 390×629、残り164pxは方向キーUIの領域。
- 修正前 `logicalW=445`, `logicalH=717.705`。描画される背景483論理pxが画面629CSSpx内で約423CSSpxに縮小され、上下に大きな背景外の緑色余白があった。
- 画像原本：承認済み `entrance_background_initial_approved.png` (1322×1190, SHA-256 cc4bca9821242facbee3984d1df7034514845195205c2b30cc94ef4628a469cf)。画像自体は描画前後とも同一。
- 既存コードは `requestAnimationFrame(draw)` により背景を高DPIキャンバスへ毎フレーム再描画。カメラはサブピクセルを保持。さらに`resize()`で同じ幅と高さでも`canvas.width/height`を再代入し、全画面を消去する構造。
- 静止中のcanvas出力は12測定すべて同じ長さで安定しており、**iPhone Safariで報告されたちらつき現象そのものをChromeで直接再現したわけではない**。上記は表示品質に影響し得る実コード上の不具合・負担。

## 適用した修正（ゲーム描画のみ）
1. エントランスの縦画面で、建築背景の高さ483論理pxをゲーム表示629CSSpxと一致させる（`logicalW = 483*390/629 ≈299.48`, `logicalH=483`）。カメラが左右へ追従し、画面左右は歩いて見られる。**他の5室の表示倍率は据え置き**。
2. `resize()`で内部canvas寸法が変わらない場合には`canvas.width/height`を再設定しない。SafariブラウザUIが表示変化した際の不要な全画面クリアを防止。
3. 描画を最大30FPSに制限し、iPhoneの負荷を軽減（方向キーの移動距離・連続入力間隔は据え置き）。
4. カメラの描画位置だけを実デバイスのピクセル単位に揃え、床目地のサブピクセル移動による揺れを緩和。ゲーム内の歩行判定や保存位置は丸めない。

## QA
- `node a18/qa-clean-redraw-20261027/qa-entrance-display-v2.cjs` PASS（DPR3 Chrome iPhone12相当、縦・横、歩行、壁/執事足元/左右額縁、初回登録、保存再読込、JS例外・通信失敗各0）。
- 修正後実測：`logicalW=299.475...`, `logicalH=483`; 390×629CSSの表示に背景の高さが合致。
- リサイズイベントを連続6回発火させ、描画画素（Canvas dataURL）が同一かつ内部サイズ未変更であることを確認、PASS。
- 静止サンプル12点のcanvas画像サイズも一致。
- `entrance-display-v2-portrait-390x844.png` と `entrance-display-v2-landscape-844x390.png` は隔離Chromeで撮影した比較用実画面。
- 既存の`entrance-collision-rebuild-regression.js`、`fixed-museum-level-regression.js`、`frame-restore-regression.js`、`frame-orientation-regression.js`も再実行して保護する。

## 注意事項
- 原画は変更しないため、画像に描かれた元来の細部・テクスチャを高精細化したわけではない。拡大時の細部には入力解像度の限界がある。
- 結果は隔離Chromeのエミュレーション。iPhone Safari実機のちらつきが完全に消えたかはユーザーの試遊後判定。
- 出口・エリア移動は今回の指示どおり無効のまま。カウンター・前景仕切りは追加しない。
