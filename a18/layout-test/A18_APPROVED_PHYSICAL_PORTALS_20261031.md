# A18｜採用背景に合わせた壁・額縁／独立展示壁・スタッフ判定と通路の再設定

検証日：2026-10-31

## 実装

- 対象：実ゲーム `web-tools-preview/a18/layout-test`。配置エディターの別ゲームではない。
- 5つの展示室の採用済み589×482背景画面の**壁際の足元／床として歩ける場所**を明示する。展示室3の奥まった中央床、展示室5の左右アーチ奥なども区別する。旧「全面歩ける」暫定処理を撤廃。
- 額縁：**背面の壁掛け額縁**は建築壁（足元）で進入を遮る。**独立展示壁／額縁付き展示体**は、実描画の `assets/approved-galleries/game-layout.json` の矩形に対応する足元だけを衝突判定。展示室1のカウンターも同様。展示室5は固定壁面額縁3枚のため独立展示体0件。
- スタッフ：既存のキャラクター画像の実際の不透明範囲から算出したスタッフの当たり判定を復活。全身の透明矩形で進入禁止にはしない。接客・会話動線は維持。
- 通路：各部屋の**目視確認済み背景開口**に合わせた当たり判定を `A18Layout.PASSAGES` に集約。 `museum-navigation.js` は同じ定義を参照し、旧の全室共通座標を撤廃。展示室1の右上通路、展示室2の北扉・左通路、展示室3/4の下中央通路・側面通路、展示室5の左右アーチと赤絨毯下端の通路をそれぞれ独立に設定。
- 部屋移動直後の**出現位置**も接続先の正しい通路（`A18Layout.ARRIVALS`）で固定し、反対側の通路や壁の中に出ないよう変更。
- まだ物語で開放されていない通路は、移動イベントの拒否だけでなく、実際の入口側での通行も拒否。
- 既存のエントランス（壁・受付・爺やの足元判定と上部通路、黒枠）は変更しない。
- 既存の旧28→26枠写真移行、保存データ、ゲーム状態、表示背景画像は無変更。

## QA

- `node tests/approved_portals_and_wall_collisions.js`：6エリア14方向の通路座標と往復関係、14到着位置、実際の床を経由した到達性（5pxグリッドBFS）、展示体の足元矩形と採用game-layout.jsonの一致、スタッフ・構造壁への衝突を検証。
- `python tests/actual_door_crossings_e2e.py`：既存QAモードで一時的に有効位置へ館長を配置し、**実際のmoveとportalDirectionだけで14方向すべての部屋移動に成功**したことをChrome 844×390・390×844で検証。部屋移動後の出現位置を検査。QA配置APIは通常モードでは利用できない。
- `python tests/gallery_collision_entrance_portal_e2e.py`：実ゲームで全展示室の壁／独立展示体／スタッフ／外周を検証、エントランスの上通路を歩行、ストーリーLv不変。
- `python tests/presentation_level_real_game_e2e.py`：公開レベル6でも物語Lv1が維持され、全14方向移動でき、Lv2の未開放北扉の当たり判定が有効、保存と再読込に問題なし。
- 既存 `tests/gallery5-test-level-regression.js`／`fixed-museum-level-regression.js`／`gallery-room-labels-regression.js`／`frame-orientation-regression.js`／`frame-restore-regression.js` と `approved_galleries_real_game_e2e.py`。既存旧レイアウト検証のうち、新背景のQAに影響する部分は採用背景の当たり判定検証へ差し替えた。
- ゲームの採用画像自体は画素変更なし。額縁の個別写真の厳密な貼付位置と奥行き描画の微調整は別件として残る。

## 運用

- Gitの正本ルールに従い、既存作業 `web-tools-preview` / `work/a18-gallery1-layout-concepts-20261028` で保管。開発のissue/mainおよび公開用 `a18-totteoki-museum` のmainは、今回の**明示的な公開指示がない限り変更しない**。
- 目視調整が必要になれば、境界を一項目ずつ差分として確認し、無断で背景画像そのものを作り直さない。
