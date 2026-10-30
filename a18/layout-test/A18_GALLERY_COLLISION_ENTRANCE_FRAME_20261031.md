# A18｜展示室の旧当たり判定解除／エントランス上通路・黒外枠 2026-10-31

## 変更仕様

承認済み背景を採用した現在のゲーム本体（`a18/layout-test`）で、従来のレイアウト当たり判定による移動不能を一時解消する。

1. **展示室1〜5**：`A18Layout.obstacles()` は空リスト。旧床置き額縁とNPCの床座標には当たらない。ゲーム側 `safeMove` と `A18Layout.walkable` の古い「上側壁は北口以外通行不可」も解除する。
2. **外周・扉は維持**：画面境界は歩行できず、エリア間移動は既存の7本・双方向14通路に限る。館の開放設定・物語による施錠条件は変更しない。各展示室の新しい実装用当たり判定は別課題。
3. **エントランスの通路**：北上部、旧木製閉扉の位置（描画 x252..317, y128..201 の内部）に、開放時だけ暗い奥行きのある上通路を描画。上部の木枠と装飾を残し、元画像のPNGは編集しない。ゲームの下端に新しい出口は設けない。北移動は従来どおり展示室5へ接続。
4. **エントランスの黒外枠**：建築背景だけでなく、館長、爺や、カウンター、間仕切り、写真、紙をすべて一括して 0.934 倍表示（黒い背景枠、左18／上15）。従来の546×483論理移動座標と保存データは不変更。タップ座標は描画変換の逆行列を適用して作品選択位置をずらさない。
5. **既存QA修正**：展示枠数が旧28→現26になったため、`frame-restore-regression.js` の27固定期待値を「現枠数-1」に修正。実際の枠定義や保存内容は変更しない。

## 実機能QA（Chrome）

- `python tests/gallery_collision_entrance_portal_e2e.py`：844×390 / 390×844 の実ゲーム、エントランス下端に移動しても別室へ出ないこと、上扉を実際に歩いて展示室5に入れること、展示室1〜5×6箇所の旧障害物位置が通行できること、外周の通行禁止、物語Lv1の保持。PASS。
- `python tests/presentation_level_real_game_e2e.py`：新規Lv6設定、14方向全経路、物語無変更、再読込、Lv2ダウングレードと自動復帰。PC/スマホ PASS。
- `python tests/approved_galleries_real_game_e2e.py`：QAレベル切替、実歩行通路、写真Blobを保持する28→26枠移行。PASS。
- Node: `fixed-museum-level-regression.js`、`gallery-room-labels-regression.js`、`gallery5-test-level-regression.js`、`frame-orientation-regression.js`、`frame-restore-regression.js`。すべてPASS。
- 実描画比較：`tests/entrance-frame-qa/entrance_before_844_baseline.png` と `entrance_after_844.png`。縦画面は `entrance_before_390_baseline.png` と `entrance_after_390.png`。比較用gallery5画像も保持。

## 残ること／安全上の範囲

展示室1〜5の当たり判定は現在**意図的に無効**。今後、採用済み独立展示壁とスタッフの足元位置を確認して新判定を設計する。エントランスの旧家具・爺やとの衝突は維持。絵や家具の見た目そのものは素材を変更していない。物語・写真の保存・レベル設定コードの変更なし。

Gitは既存 `web-tools-preview` の `work/a18-gallery1-layout-concepts-20261028` を継続。issue/main、公開repo `a18-totteoki-museum-pages` のmainの変更は指示がないため実施しない。
