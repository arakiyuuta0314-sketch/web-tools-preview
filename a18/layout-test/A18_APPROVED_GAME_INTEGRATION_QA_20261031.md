# A18｜採用背景の正式ゲームへの実装・検証（2026-10-31）

## 実装範囲
対象は `web-tools-preview/a18/layout-test/` の既存ゲームエンジン（試作品エディターではない）。既存 `work/a18-gallery1-layout-concepts-20261028` を継続利用した。

- 展示室1: 承認v13、展示室2: A建築、展示室3: 承認v09構造、展示室4: 承認v01、展示室5: v21採用＋仮番号左2／中央1／右3（v22）を直接ゲームのP3描画に採用。
- 承認930×582画像は非破壊で保存、別途ゲーム論理サイズ589×482の表示素材を作成。上部350pxは均一縮小、石床の下側のみ縦に延長し、額縁の縦横比を損なわない。生成方法／ハッシュは `tests/build_approved_gallery_game_assets.py` と `assets/approved-galleries/approved-gallery-manifest.json`。
- 展示壁4/5・各室独立展示壁は承認済みレイヤー画像を別素材としてロード（`game-layout.json` に正本サイズ・ゲーム表示位置）。旧P3の扉画像／旧フルルーム画像／P5重ね素材が新しい建築画像に二重表示されないよう、新P3背景描画に切り替えた。
- ギャラリー1の北口とギャラリー2の北口のX座標を、新建築の扉に合わせて修正。既存の全7本／往復14方向接続関係は保持。
- 展示室5は既存workの3枠化／保存写真の保護付き移行を継承。額縁の輪郭が背景に焼き込まれているため空枠の重複を抑止し、登録写真は背景上の3展示面へ描く。
- エントランスの承認済み背景・受付・仕切り壁・初期導入／会話、写真のBlob原本、IndexedDB保存と開放判定のロジックは変更なし。

## 自動／実画面QA
- Node: `node --check museum-p3-renderer.js`、`node --check museum-navigation.js`、`node --check layout-system.js`
- `node tests/gallery5-test-level-regression.js`：館Lv1〜6、26枠、ID維持と旧28枠写真Blob移行
- `node tests/gallery-room-labels-regression.js`：各室名・既存ID／開放関係
- `python tests/approved_galleries_real_game_e2e.py`：実ゲームChrome、6室・14方向、エントランス物理歩行、展示室1の移設北口への迂回歩行、館Lv6→2、通常保存とQA保存の隔離、28→26枠旧写真の復元
- 同じE2Eを390×844px（縦型）でも実行：Chrome QA通過
- 監修画像：`tests/approved-gallery-preview-QA/gallery_1.png`〜`gallery_5.png`。5枚とも実ゲームをLv6 QAで描画した証跡。

## 正式公開へ進む前に残すべき事項
今回の描画接続とエリア間移動は実ゲームコードに統合したが、**正式ゲームの配信repo/mainへは未反映**。比較Pagesと正式ゲームPagesを混同しない。

- 展示室1〜4の**写真配置時のフレーム座標**は既存589×482の固定レイアウトを維持している。新しい背景の独立展示壁・壁面へ写真を貼り付けたときの一致はまだ監修が必要。空枠カードの重複表示のみ取り除いた。
- 独立展示壁の見た目と、既存の床置きフレーム判定・スタッフ位置の当たり判定との完全一致は未検証。追加の歩行・撮影登録QAが必要。
- 旧P5の全画面累積装飾は新しい承認建築と衝突するため描かず、展示室の見た目は現在Lv6でも固定。進行ロジックやLv開放は維持。
- エントランスは既存正式版のまま。全室新しい建築への接続を確認しても、旧正式ゲームのPagesへ公開・主ブランチ統合の承認が必要。

## Git
対象dev repoのissueは `issue/a18-gallery-display-names-20261028`、本成果は既存 `work/a18-gallery1-layout-concepts-20261028`。未統合部分のマージは指示が出るまで行わない。公開版 `a18-totteoki-museum-pages/main` は不変更とする。
