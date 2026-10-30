# A18｜移動・衝突判定の実可視化 2026-10-31

## 目的
ユーザーがスマホで撮影した展示室1／2／4、エントランスの画面で、背景の開口と移動トリガー、壁・独立展示壁・スタッフの衝突判定がどこで不一致なのか、そのまま比較できるようにする。

## 有効化
- ゲームURLに `?hitboxes=1` を付ける（すでにクエリがある場合は `&hitboxes=1`）。
- 通常ゲームとQAゲームのどちらでも有効。右側「判定を隠す／表示」ボタン、および歯車 →「移動判定の確認」チェックボックスで切り替え。
- 通常の閲覧では初期値OFF、URL指定のみON。選択はその画面内のみ、**保存データ・写真・進行度・館レベルを変更しない**。

## 描画の基準
- **緑線＝歩ける領域の輪郭**。`index.html/safeMove(x,y)` を4px格子で評価し、周囲が通れなくなる境界を描く。黒い建築外枠そのものに沿って線を描くのではなく、壁・足元衝突・床判定による実際の歩行境界を示す。
- **赤＝実障害物**。`L.obstacles(fixtures,galleryIndex)` から表示。スタッフと独立展示壁の足元、エントランスの家具。
- **青＝実際の移動トリガー**。`A18Layout.PASSAGES` の各方向から、ゲーム内 `portalDirection()` と同じ 6px/4px 内側、19px 西東トリガーを算出。金色の破線は開口の定義矩形で、青の帯より広い。
- **白十字＝到着地点**。`A18Layout.ARRIVALS[room]` から表示する入室座標。適当な固定地点は描かない。
- 未開放の通路は青ではなく橙として表示する。背景素材には描き込まない。

**重要**：今回の作業は可視化機能の実装のみ。歩行・衝突・到着の**数値は変えていない**。線は実際の判定の現状であり、背景との不一致があればユーザーの監修後に修正する。

## 実装範囲
- `collision-debug-overlay.js`：画素境界のキャッシュ、移動トリガー/入室点描画、障害物矩形。キャンバスの実際のカメラ行列に重ねる。
- `index.html`：読み込み、上部の固定凡例、設定チェックボックス、切替ボタン、デバッグ情報の読み取りAPI。エントランス描画キャッシュのスイッチ対応。
- `tests/collision_overlay_visual_e2e.py`：Chrome 844×390 と 390×844 で6エリアずつ、実描画・実通路と入室データ比較・トグル・保存Revisionと物語不変・JavaScript例外なし。スクリーンショット12枚は `tests/collision-visual-qa/`。
- 通常ゲーム（`?hitboxes=1` のみ、`qa=1` なし）でも表示と歯車での切替をChromeで確認。

## QA
- `python tests/collision_overlay_visual_e2e.py`：12画面の実表示、通常操作を損なわずON/OFF可能、ゲーム保存無変更。
- `node tests/approved_portals_and_wall_collisions.js`：現行14方向の通路・壁・スタッフ判定を保持。
- `node tests/gallery5-test-level-regression.js`・`fixed-museum-level-regression.js`・`gallery-room-labels-regression.js`：既存回帰を維持。

## Git
ゲーム開発 `web-tools-preview` の既存work `work/a18-gallery1-layout-concepts-20261028` を継続。いかなるrelease反映でも別公開repo `a18-totteoki-museum` の指定ファイルのみを対象にし、開発mainへの自動統合をしない。
