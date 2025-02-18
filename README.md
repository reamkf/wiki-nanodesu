# Wiki Nanodesu
https://reamkf.github.io/wiki-nanodesu/

[**アプリ版けものフレンズ３wikiなのだ！**](https://seesaawiki.jp/kemono_friends3_5ch/) の補助サイトです。

1ページあたりの文字数制限にひっかかるなどの理由により、Seesaa Wikiでの運用が困難なページを代わりにをホストします。

## 環境構築
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

## 開発環境での実行
```sh
bun dev
```

## テストの実行
```sh
bun test
```

## ビルド
```sh
bun build
```

## リント
```sh
bun lint
```

## デプロイ
[GitHub](https://github.com/reamkf/wiki-nanodesu) のmainブランチへpushすると、GitHub Actionsで自動デプロイされる

### リンク
- [ワークフローファイル](https://github.com/reamkf/wiki-nanodesu/blob/main/.github/workflows/nextjs.yml)
- [ワークフロー実行ログ](https://github.com/reamkf/wiki-nanodesu/actions/workflows/nextjs.yml)