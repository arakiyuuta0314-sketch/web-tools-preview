# A18 Web試遊入口の更新（2026-10-26）

- 目的：総合PagesのA18入口を旧a18/scenes-previewからP7-C保存・操作検証済みの専用Web試遊版へ移す。
- 起点：web-tools-preview origin/main 4e1ea73。
- 作業ブランチ：feature/a18-portal-live-game-20261026。
- 統合先：web-tools-preview main（動作確認後にFast-forward）。
- 正式リンク（回帰修正版）：https://arakiyuuta0314-sketch.github.io/a18-totteoki-museum/layout-test/index.html?v=20261026-2165a87
- 更新対象：app-catalog.json / index.htmlのA18入口のみ。他アプリの入口は変更しない。
- 採用基準：A18入口1件、リンク先HTTP 200、主要JS取得200、隔離Chrome（390x844）のDOMに館内UIとcanvasが存在し起動エラー表示なし。
- QA実績：5件のアプリ一覧を検証、ゲームと主要5本のJS全てHTTP 200、隔離ChromeのDOMに必要要素あり、Chrome stderrに検出可能なエラーなし。
- 10/26追加：v09の額縁OFF背景をゲームへ統合後、既存v3保存との位置ずれ、側通路、初期画像読み込みを修正（ゲーム側コミット0ff123d）。今回のリンクは同修正版本体を指す。写真や保存形式は変更せず、iOS公開を意味しない。背景全体の美術最終承認、入口レベル別装飾は未確定。
- 共通コンポーネント：静的カタログのURL変更のみで再利用対象なし。
- 終了方針：統合・Push・公開確認後、作業worktreeを整理対象として記録。旧作業ブランチの一括削除は行わない。

- 10/26 v10修正: 開発正本 web-tools-preview main b8f8d26、公開ゲーム a18-totteoki-museum main 2165a87。変更ランタイム17ファイルのSHA照合合格。縦横可変額縁・元画像の高画質表示を復元。
