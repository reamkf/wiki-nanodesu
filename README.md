# Wiki Nanodesu
https://reamkf.github.io/wiki-nanodesu/

[**アプリ版けものフレンズ３wikiなのだ！**](https://seesaawiki.jp/kemono_friends3_5ch/) の補助サイトです。

1ページあたりの文字数制限にひっかかるなどの理由により、Seesaa Wikiでの運用が困難なページを代わりにをホストします。

## 技術スタック
- Bun 1.2.2
- Next.js 15.1.7 (App Router, SSG)
- TypeScript 5.7.3
- Tailwind CSS 3.4.11
- React 19.0.0
- GitHub Pages

## 開発環境

### 環境構築
1. Bun 1.2.2をインストールする
2. リポジトリをcloneする
	```sh
	git clone https://github.com/reamkf/wiki-nanodesu.git
	cd wiki-nanodesu
	```
3. パッケージをインストールする
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

### デプロイ
[GitHub](https://github.com/reamkf/wiki-nanodesu) のmainブランチへpushすると、GitHub Actionsで自動デプロイされる

#### リンク
- [ワークフローファイル](https://github.com/reamkf/wiki-nanodesu/blob/main/.github/workflows/nextjs.yml)
- [ワークフロー実行ログ](https://github.com/reamkf/wiki-nanodesu/actions/workflows/nextjs.yml)