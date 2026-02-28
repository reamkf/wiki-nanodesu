# アプリ版けものフレンズ３wikiなのです🦉
リンク: https://reamkf.github.io/wiki-nanodesu/

[**アプリ版けものフレンズ３wikiなのだ！**](https://seesaawiki.jp/kemono_friends3_5ch/) の補助サイトです。

1ページあたりの文字数制限にひっかかるなどの理由により、Seesaa Wikiでの運用が困難なページを代わりにをホストします。

## データ
当サイトで使用するデータはGoogleスプレッドシートで管理しています。
データを修正するには、Googleスプレッドシート上で修正してください。

- [フレンズデータ](https://docs.google.com/spreadsheets/d/1p-C3wbkYZf_2Uce2J2J6w6T1V6X5eJmk-PtC4I__olk/edit?gid=2049658683#gid=2049658683)
- [フォトデータ](https://docs.google.com/spreadsheets/d/1p-C3wbkYZf_2Uce2J2J6w6T1V6X5eJmk-PtC4I__olk/edit?gid=442640506#gid=442640506)

または、[アプリ版けものフレンズ３wikiなのだ！](https://seesaawiki.jp/kemono_friends3_5ch/) のコメントや掲示板へメッセージを投げていただければ修正します。

## 貢献
サイトに関するIssueやPull Requestを歓迎します。

## 技術スタック
- Bun
- Next.js (App Router, SSG)
- TypeScript
- Tailwind CSS v4
- React
- GitHub Pages

## 開発環境

### セットアップ
1. Gitをインストールする
2. Bunをインストールする
3. リポジトリをcloneする
	```sh
	git clone https://github.com/reamkf/wiki-nanodesu.git
	cd wiki-nanodesu
	```
4. パッケージをインストールする
	```sh
	bun install
	```

### 実行
- 開発サーバーの起動
	```sh
	bun dev
	```
- ユニットテスト
	```sh
	bun test
	```
- E2Eテスト
	ビルド済みの静的ファイル(`out/`)に対してブラウザテストを実行
	```sh
	bun run build
	bun run test:e2e
	```
	初回はPlaywrightブラウザのインストールが必要:
	```sh
	bunx playwright install chromium
	```
	UIモードで実行する場合:
	```sh
	bun run test:e2e:ui
	```
- リント
	```sh
	bun lint
	```
- ビルド
	```sh
	bun run build
	```
- サーバーの起動
	```sh
	bun run serve
	```

### Google Sheets APIからのデータ取得
スプレッドシートからローカルでCSVファイルを取得するには、以下の手順で設定してください。

1. **Google Cloud ConsoleでAPIキーを作成**
   - [Google Cloud Console](https://console.cloud.google.com/) にアクセス
   - 「APIとサービス」→「ライブラリ」で「Google Sheets API」を有効にする
   - 「APIとサービス」→「認証情報」で「認証情報を作成」→「APIキー」を選択
   - 作成したAPIキーを「キーを制限」で「Google Sheets API」のみに制限することを推奨

2. **スプレッドシートを公開設定にする**
   - 対象のスプレッドシートで「共有」をクリック
   - 「リンクを知っている全員が閲覧可」に設定
   - （注意: APIキー認証では公開されたスプレッドシートのみアクセス可能）

3. **環境変数を設定**
	```sh
	cp .env.example .env
	```
	.envファイルを編集して`GOOGLE_API_KEY`を設定

4. **CSVファイルを取得**
	```sh
	bun fetch-csv
	```

### デプロイ
[GitHub](https://github.com/reamkf/wiki-nanodesu) のmainブランチへpushすると、GitHub Actionsにより自動でGitHub Pagesへデプロイされる

- [ワークフローファイル](https://github.com/reamkf/wiki-nanodesu/blob/main/.github/workflows/nextjs.yml)
- [ワークフロー実行ログ](https://github.com/reamkf/wiki-nanodesu/actions/workflows/nextjs.yml)
