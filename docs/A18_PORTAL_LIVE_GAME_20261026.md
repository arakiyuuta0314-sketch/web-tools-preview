# A18 Web試遊入口の更新（2026-10-26）

- 目的：総合PagesのA18入口を旧a18/scenes-previewからP7-C保存・操作検証済みの専用Web試遊版へ移す。
- 起点：web-tools-preview origin/main 4e1ea73。
- 作業ブランチ：feature/a18-portal-live-game-20261026。
- 統合先：web-tools-preview main（動作確認後にFast-forward）。
- 正式リンク：https://arakiyuuta0314-sketch.github.io/a18-totteoki-museum/layout-test/index.html?v=20261026
- 更新対象：app-catalog.json / index.htmlのA18入口のみ。他アプリの入口は変更しない。
- 採用基準：A18入口1件、リンク先HTTP 200、主要JS取得200、隔離Chrome（390x844）のDOMに館内UIとcanvasが存在し起動エラー表示なし。
- QA実績：5件のアプリ一覧を検証、ゲームと主要5本のJS全てHTTP 200、隔離ChromeのDOMに必要要素あり、Chrome stderrに検出可能なエラーなし。
- 留保：エントランス美術v09は比較用合成画像（キャラクターを含む）で、ゲーム描画用の独立アセットとして未統合。今回のリンク更新は最新美術の採用やiOS公開を意味しない。保存形式は変更しない。
- 共通コンポーネント：静的カタログのURL変更のみで再利用対象なし。
- 終了方針：統合・Push・公開確認後、作業worktreeを整理対象として記録。旧作業ブランチの一括削除は行わない。
