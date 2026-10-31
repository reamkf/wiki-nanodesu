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

下記のサービスアカウント設定を行い、`.env`に`GOOGLE_APPLICATION_CREDENTIALS`を設定する。`push-csv`と同じJSON鍵を使用でき、APIキーやシートの一般公開は不要。取得だけならサービスアカウントの共有権限は「閲覧者」でよい。

```sh
# CSVを取得（自動コミットなし）
bun scripts/fetch-csv-from-sheets.ts

# CSVを取得して変更を自動コミット
bun run fetch-csv
```

GitHub Actionsの定期取得には、リポジトリの「Settings」→「Secrets and variables」→「Actions」で`GOOGLE_SERVICE_ACCOUNT_JSON`というSecretを追加し、JSON鍵の内容全体を保存する。ワークフローは一時ファイルに鍵を書き出し、処理終了時に削除する。旧`GOOGLE_API_KEY`は使用しない。

### CSVをGoogle Sheetsへ反映

サービスアカウントを設定すると、実行時にアクセストークンを自動取得できる。APIキーだけでは書き込めない。

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを選び、「APIとサービス」→「ライブラリ」でGoogle Sheets APIを有効にする。
2. 「IAMと管理」→「サービスアカウント」でサービスアカウントを作成する。プロジェクトのIAMロール付与は不要。
3. 作成したアカウントの「キー」→「鍵を追加」→「新しい鍵を作成」でJSONを選び、ダウンロードする。組織のポリシーで鍵作成が禁止されている場合は管理者に確認する。
4. JSON鍵をリポジトリ外の安全な場所（例: `/home/ユーザー名/.config/wiki-nanodesu/service-account.json`）に保存し、所有者だけが読めるようにする（Linuxでは `chmod 600 ファイルパス`）。鍵をGitにコミットしたり、他人に共有したりしない。
5. 対象スプレッドシートの「共有」で、JSON内の`client_email`を「編集者」として追加する。書き込みのためにシートを一般公開する必要はない。
6. `.env`に鍵ファイルの絶対パスを設定する。Bunが`.env`を自動で読み込む。

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=/home/ユーザー名/.config/wiki-nanodesu/service-account.json
```

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

fetch-csvと同じスプレッドシート・列範囲を使用する。数式セルは表示値に差分があっても更新せず、`--overwrite-empty`でも消去しない。数式以外のセルは表示値が異なる場合のみ文字列として更新する。変更のないセルの型やセルの書式は維持する。数値や日付も文字列として反映されるため、シート内で計算に使う列は事前に差分を確認すること。数式の取得から書き込みまでの間に他の利用者が数式を追加する同時編集には対応しない。

デフォルトではローカルの空文字セルとCSVに存在しない行・列は更新せず、リモートの値や数式を保持する。`--skip-empty`の明示指定も可能。`--overwrite-empty`を指定すると、空セルやCSVから削除された行・列の値もシート側で消去する。両オプションは同時に指定できない。スペースだけのセルは更新対象となる。`--dry-run`やシート名の指定と併用できる。

### デプロイ

[GitHub](https://github.com/reamkf/wiki-nanodesu) のmainブランチへpushすると、GitHub Actionsにより自動でGitHub Pagesへデプロイされる

- [ワークフローファイル](https://github.com/reamkf/wiki-nanodesu/blob/main/.github/workflows/nextjs.yml)
- [ワークフロー実行ログ](https://github.com/reamkf/wiki-nanodesu/actions/workflows/nextjs.yml)
