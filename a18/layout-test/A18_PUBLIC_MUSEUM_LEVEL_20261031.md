# A18｜館内公開レベル（物語と独立）実装・QA 2026-10-31

## 仕様

実際のゲーム（`a18/layout-test`）の初回プロフィールおよび通常設定に、館内の公開範囲の選択を実装。

- **自動（既定）**：従来通り物語の開放に合わせる。旧v3セーブの `presentationLevel` 欠損も自動と扱う
- **館Lv.1〜6**：館の公開範囲を自分で指定。Lv.6なら新規ゲームから展示室5まで全エリア入れる
- **実効公開レベル**：`max(progression.unlockedThroughLevel, presentationLevel ?? progression.unlockedThroughLevel)`。後から設定を下げても物語で解放済みの部屋は閉じない
- **完全に独立した記録**：`presentationLevel` は作品・プロフィール等と同じv3のセーブ内に独立保存。物語の `progression` オブジェクトやイベント `events`／`awardedRoomIds` を変更しない
- 表示：ステータスは「館Lv.6／物語Lv.1」のように別表示。館内図は物語で未解放の部屋を「公開設定で利用可能」と表示する
- **変更を下げた際の安全性**：現在地が設定変更後に入れない部屋になった場合のみエントランスの安全な位置へ移動
- **リセット**：作品のみ削除する場合は設定を維持。全リセットでは自動へ戻す
- **QAモード**：既存の `?qa=1` による物語レベルを直接変更するテスト機能はQA専用のまま分離

## 範囲と表現上の制約

現行正式ゲームの建築背景は採用済みの固定画像。今回の実装は公開範囲・移動可能な部屋・マップと設定の切替であり、**未導入の豪華装飾素材やLv.6の別建築画像を自動的に追加するものではない**。エントランスのLv.1→Lv.6独立装飾・各展示室の段階的な外観変化は、既存アートの監修後に専用対応が必要。無承認で旧P5全画面画像を重ねない。

## 実コード

- `museum-p2-storage.js`：v3保存の後方互換オプション、厳密な1〜6検証、`accessLevel`、実際に入れる部屋の整合
- `index.html`：初回・設定画面、保存・読み込み、実移動・扉開放・館内図、物語Lvとの表示分離
- `museum-navigation.js`：物語の開放Lvと設定による公開Lvの表示を分離
- `tests/presentation_level_real_game_e2e.py`：通常モードでのPC／スマホ実ブラウザE2E

## QA結果

- Chrome 844×390 / 390×844：新規Lv.6選択、14方向の実エリア移動、通常保存・リロード、Lv.2変更、設定の自動復帰、旧v3セーブ欠損互換、範囲外入力拒否、物語 `progression` のJSON完全不変を確認
- 既存 `node tests/fixed-museum-level-regression.js`／`gallery-room-labels-regression.js`／`gallery5-test-level-regression.js` および既存 `approved_galleries_real_game_e2e.py`（QA Lv切替・旧28→26枠移行）通過
- 初回設定画面と通常設定画面の実際のブラウザスクリーンショットは `tests/presentation-level-e2e/`

## Git／公開

既存worktree `web-tools-preview-a18-gallery-display-names-20261028`、既存 `work/a18-gallery1-layout-concepts-20261028` に継続実装。未統合の既存成果を保持するため新規worktreeは作らない。
この修正だけを理由に開発issue/mainを更新しない。正式公開リポジトリ `a18-totteoki-museum-pages/main`（2026-10-31現在 `ac2fd21`）の更新も明示許可まで行わない。
