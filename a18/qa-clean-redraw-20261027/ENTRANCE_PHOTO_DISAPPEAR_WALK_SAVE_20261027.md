# A18 エントランス｜歩行後の写真消失・ちらつき修正（2026-10-27）

## ユーザー申告・実物
iPhone Safari実画面では、前回v3で表示倍率は戻ったが、歩行中にちらつきが続き、**展示2/2にも関わらず奥の左右額縁の写真が両方とも消失**。受領画像はチャット添付 IMG_6458.jpeg。

## 原因（実ソース確認）
- `requestSave()`は歩行終了後450msで保存する。
- 修正前は位置だけを保存する場合でも `applyCommitted()` が毎回 `P2.hydrate(save.works)` を呼び、全作品の `blob:` URLを再作成して旧URLを直ちに `URL.revokeObjectURL()` していた。
- `artworkImage()` はURL変更を検知すると `new Image()` と再読込へ進み、読込完了まで表示が空になる。移動のたびにこの処理が連鎖し写真がちらつく。iPhoneでの消失と強く整合する再読み込み処理の不具合。
- 以前の静止描画省略と、ロード中の写真の書き換えが重なる場合の表示不整合も避ける必要がある。

## 修正仕様
- 歩行座標だけの保存処理では `preservePhotoURLs:true` を渡し、既存の `works` と `originalURL` および画像デコード済みキャッシュをそのまま再利用する。作品のID、額縁位置、タイトル、元BlobサイズとMIMEが変わっていないことをチェックして誤用を fail-fast にする。
- **写真・備考・作品を変更する通常の保存**では従来どおり再hydrationする。ただし、失効URLを参照してしまう旧画像キャッシュは消去する。
- 既存の保存スキーマ、IndexedDB、写真Blob本体、背景正式PNG、画角`logicalW=445`、位置/当たり判定、初期化や移行処理は変更しない。

## 再現QA（実ブラウザ・隔離Chrome / iPhone縦DPR3）
- 新規の独立Chromeプロファイルでテスト画像2枚（マゼンタ・緑）をIndexedDB v3へ保存し、左右2枠へ展示。
- 左右の画像のCanvasピクセル値がそれぞれ `[255,53,204,255]` / `[17,238,170,255]` であることを確認。
- 3回歩き、各450ms保存処理完了を待ち、展示ピクセルを繰り返し計測。**3回とも写真表示維持**。
- 位置保存による `URL.createObjectURL` / `URL.revokeObjectURL` の呼出しを監視。**両方0回**（旧コードでは毎保存で実行）。
- 保存revision 4→7、ページ再読み込み後の展示写真両方のピクセル値を再確認。消失なし。
- `qa-entrance-two-art.cjs`：PASS。保存安全性、画角445、エリア移動停止、執事背面・足元判定、左右額縁2か所、縦/横画面、JS例外0、通信失敗0。
- 既存4回帰: `entrance-collision-rebuild-regression.js`、`fixed-museum-level-regression.js`、`frame-restore-regression.js`、`frame-orientation-regression.js` PASS。
- 合成QA画像はあくまで表示テスト用で、ユーザーの登録済み作品は操作・削除しない。

## 未確認・完了条件
- Windows隔離Chromeでの再現防止検証はPASS。
- **実際のiPhone Safariのちらつき・消失が解消したかは、公開後にユーザーの実機で再確認**する。検証なしに「iPhone完全解消」とは言わない。
- 正式採用背景の画質/解像度自体は変更していない。画質不満は別評価として残す。

## Git・公開
- 開発: `web-tools-preview` の既存 `feature/a18-entrance-clean-redraw-20261027` を継続。
- 配布: `a18-totteoki-museum-pages` の既存公開差分用 `feature/a18-entrance-collision-release-20261027` に**index.htmlのみ**反映。公開 `main`をfast-forward後、GitHub Pagesの実配布JS/HTMLを照合する。
