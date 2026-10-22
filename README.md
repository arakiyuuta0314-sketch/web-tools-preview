# アプリ開発室｜Webプレビュー総合ページ

指定された固定の総合ページ：
https://arakiyuuta0314-sketch.github.io/web-tools-preview/

このリポジトリでは、完成済み・開発中のアプリを1ページから開けるように公開しています。

## 全アプリ共通：まずWeb、次にiOS

1. まずWeb版で主要な画面・機能・操作導線を作る。iPhone Safariでも実機の操作感を検証する。
2. 公開したWeb版は、試作の途中からこの総合ページへ追加する。開発中であっても一覧から開けるようにする。
3. Web版の機能と操作感が確認できてからiOS対応へ進む。iOS固有の画面向き・権限・広告・課金・保存・性能・端末差分は別途検証する。
4. TestFlightによる実機検証、正式iOSビルド、App Store審査申請へ進む。
5. 新規開発やWeb版の新バージョンを公開する作業には、この総合ページの更新と公開URL検証を含める。

Webで確認できたからといって、ネイティブのiOS対応が完了したとは扱わない。

## 新しいアプリを総合ページに追加する

必ずリポジトリ直下の app-catalog.json を更新する。index.html を手で直接編集しない。

- Web公開できる作品の入口（例 new-app/index.html）を先に確認する。
- app-catalog.json の entries に新規オブジェクトを1件追加する。IDは重複禁止。name、subtitle、description、emoji、url、version、stage、ctaを設定する。
- stageは「開発中」「Webプレビュー」「Webテスト」。開発途中の状態でも追加する。
- 過去版や比較版がある場合は links 配列へ追加する。
- コマンド python build-portal.py で、存在しないローカルリンクやID重複などを検証して index.html を自動生成する。
- デスクトップとスマートフォン幅で表示・検索・リンクを確認する。
- 差分・安全性を確認してコミットし、GitHub Pagesデプロイと公開URLでの表示を検証する。

関連ファイル：
- app-catalog.json … 公開するアプリ一覧の唯一の正
- build-portal.py … カタログからindex.htmlを生成、リンク妥当性検査
- app-index.css … 総合ページのスタイル
- app-index.js … ページ内のローカル検索
- index.html … 自動生成された公開トップページ

これにより、今後アプリが増えても既存カードを消さず、カタログへ追記して再生成するだけで一覧更新できる。

## 現在登録しているWeb版

- パズル美術館：/a18/scenes-preview/（開発中の最新版）／旧50作品版 /a18/ ／美術館画像比較版 /a18/art-preview/
- こつこつ500円貯金：/coin-jar/
- マイプロフ：/myprof/
- 願いを育てる -Wish Note-：/wish-note/
- FLIP & FIX Market：別GitHub Pagesの試遊用URL

## プレビューのコピーを作る操作は別

build-preview.mjs は、独立したiOS開発リポジトリのWeb素材を安全確認した上で、このWeb公開用プロジェクトにスナップショットとしてコピーするための手動スクリプト。

トップページ更新だけのために build-preview.mjs を実行しないこと。実行する場合は元のWeb素材、公開不要な情報、広告・課金の状態を確認する。

## 安全と公開範囲

- このGitHub Pagesは一般公開。robotsのnoindexはアクセス制御ではない。
- 秘密鍵・APIキー・個人の作品写真・ユーザーの実データなどを公開しない。
- Webプレビューの保存は正式なiOSアプリの保存とは別。ブラウザデータ削除や更新で消える可能性がある。
- AppleのIAP、AdMob、ネイティブ通知・権限などはWeb版では実機同等に検証できない。
