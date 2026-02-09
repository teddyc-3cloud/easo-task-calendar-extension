# Change Log

All notable changes to the "Task Calendar" extension will be documented in this file.

## [1.0.0] - 2026-02-07

### Added
- ガントチャート形式のタスク表示
- 日/週/月の3つの表示モード切替
- タスクのドラッグ＆ドロップによる移動・期間変更
- タスクバー両端のリサイズハンドルで開始日・終了日を調整
- 3つのステータス管理（実行中・待機中・完了）
- タスクごとに複数の締め切りを設定
- 締め切りマーカーのカレンダー表示とドラッグ操作
- タスクへのリンク追加機能
- 9色のカラーパレットによるタスク色分け
- タスク名での絞り込み検索
- 手動順/締切順のソート切替
- ダークモード/ライトモード対応
- VSCodeテーマへの自動追従
- `.tcal` ファイル形式でのデータ保存

## [1.0.1] - 2026-02-09

### Fixed / Updated
- Added fork attribution note to README (translated to English)
- Built and included `webview-ui` production assets (`dist/index.js`, `dist/index.css`)
- Fixed webview Content-Security-Policy to allow loading local script URIs (`webview.cspSource`)
- Packaged and installed updated `.vsix` with built webview assets

