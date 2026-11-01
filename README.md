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

1. Git、Bunをインストールする
2. リポジトリをcloneする
    ```sh
    git clone https://github.com/reamkf/wiki-nanodesu.git
    cd wiki-nanodesu
    ```
3. パッケージをインストールする
    ```sh
    bun install
    ```

#### Googleスプレッドシートのサービスアカウントの設定

後述のGoogleスプレッドシートとのデータのやりとりをする場合、サービスアカウントの設定が必要です。

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを選び、「APIとサービス」→「ライブラリ」でGoogle スプレッドシート APIを有効にする。
2. 「IAMと管理」→「サービスアカウント」でサービスアカウントを作成する。プロジェクトのIAMロール付与は不要。
3. 作成したアカウントの「キー」→「鍵を追加」→「新しい鍵を作成」でJSONを選び、ダウンロードする。組織のポリシーで鍵作成が禁止されている場合は管理者に確認する。
4. JSON鍵をリポジトリ外の安全な場所（例: `/home/ユーザー名/.config/wiki-nanodesu/service-account.json`）に保存し、所有者だけが読めるようにする（Linuxでは `chmod 600 ファイルパス`）。鍵をGitにコミットしたり、他人に共有したりしない。
5. 対象スプレッドシートの「共有」で、JSON内の`client_email`を「編集者」として追加する。
6. `.env`に鍵ファイルの絶対パスを設定する。Bunが`.env`を自動で読み込む。

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=/home/ユーザー名/.config/wiki-nanodesu/service-account.json
```

GitHub Actionsで取得するためには、リポジトリの「Settings」→「Secrets and variables」→「Actions」で`GOOGLE_SERVICE_ACCOUNT_JSON`というSecretを追加し、JSON鍵の内容全体を保存します。

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
- Google スプレッドシートからのCSV取得
    ```sh
    # CSVを取得（自動コミットなし）
    bun scripts/fetch-csv-from-sheets.ts

    # CSVを取得して変更を自動コミット
    bun run fetch-csv
    ```
- ローカルのCSVをGoogle スプレッドシートへ反映
    ```sh
    # 全CSVの差分を確認（書き込みなし）
    bun run push-csv --dry-run

    # 全CSVを反映
    bun run push-csv

    # ローカルの空セルでリモートの値を消去
    bun run push-csv --overwrite-empty

    # シート名で対象を指定（複数指定可）
    bun run push-csv フレンズデータ
    ```

### CSV行の原文取得

```sh
bun run get-csv-row --file csv/フレンズデータ.csv --key '{"ID":"シロツチノコ"}' --format json
bun run get-csv-row --file csv/イベントデータ.csv --key '{"イベント名":"対象名","開催開始":"CSVと同じ文字列"}' --format tsv
```

`--key` で指定した1行を、CSVの文字列と列順を保ったまま標準出力に出力します。JSONには列名の `headers`、1始まりの行番号 `rowNumber`、配列の `values`、列名で引ける `record` が入ります。改行やタブを含むセルはJSON形式で出力してください。ファイルに保存する場合はシェルのリダイレクトを使用します。既存ファイルの上書きに注意してください。

### デプロイ

[GitHub](https://github.com/reamkf/wiki-nanodesu) のmainブランチへpushすると、GitHub Actionsにより自動でGitHub Pagesへデプロイされます。

- [ワークフローファイル](https://github.com/reamkf/wiki-nanodesu/blob/main/.github/workflows/nextjs.yml)
- [ワークフロー実行ログ](https://github.com/reamkf/wiki-nanodesu/actions/workflows/nextjs.yml)
