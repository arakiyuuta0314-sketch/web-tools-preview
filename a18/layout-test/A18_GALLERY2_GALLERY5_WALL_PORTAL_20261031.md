# A18｜展示室2の黒枠・左上入室／展示室5の通路中央寄せ（2026-10-31）

## 実際の採用背景と確認結果
- 展示室2のゲーム用画像だけに、他展示室と同じ**四角い黒い外周**を追加。上10px・下17px・左28px・右28px。展示室2の上側・左側の通路だけは黒枠を切り欠き、床をそのまま見せる。大元の承認済み930×582画像は画素変更しない。
- 表示用の変換スクリプト `tests/build_approved_gallery_game_assets.py` に同じ生成工程を追加。既存派生画像 `gallery2_game_589x482.png` のみ更新し、manifestに実SHA256を記録。承認元SHA256は固定。
- エントランス右通路から入る展示室2の左（west）通路を、旧左下 y350〜430 から**左上 y190〜298**に移し、出現座標を旧(93,396)→**(58,239)**に変更。展示壁の奥側・左上へ出るため中央床の障害物には出現しない。
- 展示室5の左右の通路を、旧左端(24〜68)、右端(521〜565)から**内側の開口**(左75〜124、右465〜514)に寄せる。高さは y385〜448。入室位置を西(139,414)、東(450,414)とする。中央の南通路と背景PNGは維持。
- `architecturalFloor` の展示室2左上の通路床も新判定に合わせる。物語・登録作品・館Lv・展示壁の当たり判定は変更なし。
- `museum-p3-renderer.js` は展示室2派生背景だけ個別キャッシュ更新、`index.html` は P3描画と配置JSをバージョン更新。旧Pagesの画像／座標が端末キャッシュから戻らないよう対策。

## 自動QA／実画面QA
- `python tests/gallery2_framing_regression.py`：承認済み原本不変、上下左右黒枠、上側左開口、実ファイルSHA256のmanifest一致を確認。
- `node tests/approved_portals_and_wall_collisions.js`：6室14通路の開口と移動後の安全地点、構造壁・展示壁・スタッフ当たり判定、到達経路をすべて確認。展示室2の左側の開口以外は黒壁を通れない。
- `node tests/fixed-museum-level-regression.js`／`gallery-room-labels-regression.js`／`gallery5-test-level-regression.js`：既存の展示室・物語・3枠・写真移行の主要回帰テスト。
- `python tests/actual_door_crossings_e2e.py`：PC844×390、スマホ390×844で14方向すべて**実際の歩行コマンド**から移動し、到着位置が新定義と合うことを確認。
- `python tests/gallery_collision_entrance_portal_e2e.py`／`presentation_level_real_game_e2e.py`：壁・展示物・スタッフに衝突、館Lv6で物語Lv1のまま全室移動、保存・読込・Lv変更成功。
- `python tests/collision_overlay_visual_e2e.py`：実ブラウザに緑=歩ける範囲・青=移動トリガー・白=出現位置を重ね、展示室2と展示室5のPC/スマホ表示を画像 `tests/collision-visual-qa/room{2,5}_{390,844}.png` に記録。表示自体の修正はなし。

## Gitと公開境界
- 開発リポジトリ `web-tools-preview` の既存workを継続。開発側issueとmainへの統合は依頼されていないため行わない。
- 正式ゲームの公開を行う場合は、**公開repo `a18-totteoki-museum-pages` のみ** work→issue→PR→mainとする。公開後はPagesの配信結果・端末幅での実画面確認を必須とする。
