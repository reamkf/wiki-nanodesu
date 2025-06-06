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
- Bun 1.2
- Next.js 15 (App Router, SSG)
- TypeScript
- Tailwind CSS v4
- React 19
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
- テスト
	```sh
	bun test
	```
- リント
	```sh
	bun lint
	```
- ビルド
	```sh
	bun run build
	```

### Google Apps Script
- ログイン
	```sh
	bun run clasp:login
	```
- GASにコードをpushする
	```sh
	bun run gas:push
	```
- GASからコードをpullする
	```sh
	bun run gas:pull
	```

### デプロイ
[GitHub](https://github.com/reamkf/wiki-nanodesu) のmainブランチへpushすると、GitHub Actionsにより自動でGitHub Pagesへデプロイされる

- [ワークフローファイル](https://github.com/reamkf/wiki-nanodesu/blob/main/.github/workflows/nextjs.yml)
- [ワークフロー実行ログ](https://github.com/reamkf/wiki-nanodesu/actions/workflows/nextjs.yml)
