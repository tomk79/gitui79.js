# GitUi79.js プロジェクト構造とインストラクション

## プロジェクト概要

GitUi79.js は、ブラウザベースの Git UI ライブラリです。JavaScript で実装され、サーバーサイドの Git コマンド実行をコールバック関数で受け取り、ブラウザ上で Git 操作を提供します。

## 技術スタック

- **言語**: JavaScript (ES6+)
- **ビルドツール**: Laravel Mix (Webpack ベース)
- **テンプレートエンジン**: Twig
- **主要依存関係**:
  - `gitparse79`: Git コマンドのパース処理
  - `px2style`: スタイリングとモーダル UI コンポーネント
  - `diff2html`: 差分表示
  - `langbank`: 多言語対応
  - `jquery`: DOM 操作とAJAX
  - `twig`: テンプレート処理
- **テストフレームワーク**: Mocha

## ディレクトリ構造

```
gitui79.js/
├── src/                          # ソースコード
│   ├── gitui79.js               # エントリーポイント
│   ├── gitui79.bundled.js       # バンドル版エントリーポイント
│   ├── js/                      # JavaScriptコアモジュール
│   │   ├── main.js             # メインロジック
│   │   └── pages.js            # ページルーティング
│   ├── pages/                   # 各機能ページ
│   │   ├── status/             # git status 画面
│   │   ├── log/                # git log 画面
│   │   ├── branch/             # git branch 画面
│   │   ├── pull/               # git pull 画面
│   │   └── push/               # git push 画面
│   ├── css/                     # スタイルシート
│   ├── languages/               # 多言語対応ファイル
│   ├── resources/templates/     # 共通テンプレート
│   └── themes/                  # テーマファイル
├── dist/                         # ビルド成果物
├── tests/                        # テストファイル
│   ├── app/                     # テスト用アプリケーション
│   │   ├── client/             # クライアントサイドテスト
│   │   └── server/             # テストサーバー
│   ├── data/                    # テストデータ
│   └── remote/                  # Git リモートテスト用
└── vendor/                       # Composer 依存関係
```

## ビルドシステム

### ビルドコマンド

```bash
# 開発ビルド
npm run dev

# ウォッチモード
npm run watch

# 本番ビルド
npm run prod
```

### ビルド設定

- `webpack.mix.js`: Laravel Mix の設定ファイル
- エントリーポイント:
  - `src/gitui79.js` → `dist/gitui79.js`
  - `src/gitui79.bundled.js` → `dist/gitui79.bundled.js`
- カスタムローダー:
  - `.txt`: raw-loader
  - `.csv`: csv-loader
  - `.twig`: twig-loader

## コアアーキテクチャ

### 初期化フロー

1. `GitUi79` コンストラクタに DOM 要素とコールバック関数を渡す
2. `init()` メソッドで初期化:
   - 言語バンク (LangBank) の設定
   - コミッター情報の取得/設定
   - メインフレームの描画
   - イベントリスナーの登録

### ページ構造

各ページは独立したモジュールとして実装:

- **status**: 作業ツリーの状態表示、ステージング、コミット
- **log**: コミット履歴表示、差分表示、バージョン巻き戻し
- **branch**: ブランチ一覧、作成、切り替え
- **pull**: リモートからの変更取得
- **push**: リモートへの変更送信

### テンプレートシステム

- Twig テンプレートを使用
- 各ページに対応する `.twig` ファイルが `pages/*/templates/` に配置
- `main.bindTwig()` メソッドでデータバインディング

## 開発ガイドライン

### コーディング規約

1. **モジュールパターン**: 各機能は `module.exports` でエクスポート
2. **Promise チェーン**: 非同期処理は Promise で連鎖
3. **イベント駆動**: DOM イベントは `addEventListener` で登録
4. **テンプレート分離**: HTML は Twig テンプレートで管理

### ファイル命名規則

- JavaScript: `kebab-case.js`
- スタイルシート: `kebab-case.scss`
- テンプレート: `snake_case.twig`

### スタイリング

- SCSS を使用
- メインスタイル: `src/css/main.scss`
- ページ固有スタイル: `src/pages/*/[page].scss`
- ダークモード: `src/themes/darkmode.scss`
- バンドル版: `gitui79.bundled.scss` には px2style が統合される

### 多言語対応

- 言語ファイル: `src/languages/language.csv`
- デフォルト言語: 日本語 (`ja`)
- LangBank ライブラリで管理
- 初期化オプションで言語設定可能: `options.lang`

## テスト

### テストの実行

```bash
# テストサーバー起動
npm start

# ブラウザでプレビュー
npm run preview

# テスト実行
npm test
```

### テスト環境

- テストサーバー: Express ベース (`tests/app/server/server.js`)
- ポート: 3000
- テストデータ: `tests/data/`
- リモートリポジトリモック: `tests/remote/`

## Git コマンド連携

### コールバック仕様

GitUi79 は実際の Git コマンド実行をコールバックで委譲:

```javascript
function(cmdAry, callback){
  // cmdAry: Gitコマンド配列 例: ['status', '-u']
  // callback: 完了時に呼ぶ関数
  //   callback(exitCode, stdout, stderr)
}
```

### Git コマンドパース

- `gitparse79` ライブラリを使用
- Git コマンドの出力を構造化データに変換
- 主な操作:
  - `git status`: 変更ファイル一覧
  - `git log`: コミット履歴
  - `git branch`: ブランチ一覧
  - `git diff`: 差分取得
  - `git show`: コミット詳細

## バージョン管理

### ブランチ戦略

- デフォルトブランチ: `develop`
- リリースタグ: セマンティックバージョニング (例: v0.5.1)

### リリースプロセス

1. バージョン更新: `package.json` の `version` フィールド
2. ビルド: `npm run prod`
3. 変更履歴: `README.md` に記載
4. コミット & タグ作成
5. npm または GitHub Releases で公開

## 配布形態

### ビルド成果物

- **スタンドアロン版**: `dist/gitui79.js` + `dist/gitui79.css`
  - px2style は外部依存として必要
- **バンドル版**: `dist/gitui79.bundled.js` + `dist/gitui79.bundled.css`
  - px2style を含む完全版

### 使用方法

```html
<!-- バンドル版 -->
<link rel="stylesheet" href="dist/gitui79.bundled.css">
<script src="dist/gitui79.bundled.js"></script>

<!-- または標準版 + px2style -->
<link rel="stylesheet" href="node_modules/px2style/dist/px2style.css">
<link rel="stylesheet" href="dist/gitui79.css">
<script src="node_modules/px2style/dist/px2style.js"></script>
<script src="dist/gitui79.js"></script>
```

## 主要機能の実装場所

### Status ページ (`src/pages/status/`)

- ファイル変更一覧表示
- ステージング/アンステージング
- 差分表示 (diff2html 使用)
- コミット実行
- 破棄操作

### Log ページ (`src/pages/status/`)

- コミット履歴表示
- コミット詳細モーダル
- ファイル別差分表示
- バージョン巻き戻し機能
- ページネーション (50件ずつ)

### Branch ページ (`src/pages/branch/`)

- ローカル/リモートブランチ一覧
- ブランチ作成
- ブランチ切り替え (checkout)
- ブランチ削除

### Pull ページ (`src/pages/pull/`)

- リモートから変更を取得
- fetch + merge の実行

### Push ページ (`src/pages/push/`)

- リモートへの変更送信
- プッシュ先ブランチ選択

## 注意事項

### セキュリティ

- Git コマンドはサーバーサイドで実行すること
- コマンドインジェクション対策を実装すること
- ユーザー入力は適切にエスケープすること

### ブラウザ互換性

- モダンブラウザ (ES6+ サポート) を想定
- jQuery 3.6+ を使用

### パフォーマンス

- 大規模リポジトリでは `git log` のページネーションを活用
- 差分表示は大きなファイルで重くなる可能性あり

## トラブルシューティング

### よくある問題

1. **ビルドエラー**: `node_modules` を削除して `npm install` を再実行
2. **テンプレートロードエラー**: twig-loader が正しく設定されているか確認
3. **Git コマンド失敗**: サーバーサイドのコールバック実装を確認

### デバッグ

- ブラウザの開発者ツールでコンソールログを確認
- `gitparse79` の出力を確認
- テストサーバーのログを確認

## 貢献ガイドライン

1. 機能追加は新しいページモジュールとして実装
2. スタイル変更は既存の SCSS 構造に従う
3. 多言語対応が必要な文言は `language.csv` に追加
4. テストを追加/更新する
5. README の変更履歴を更新する

## ライセンス

MIT License

## 作者

Tomoya Koyanagi (tomk79@gmail.com)
