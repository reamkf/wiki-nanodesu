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

## Googleスプレッドシート / CSV操作

- GOogleスプレッドシートのデータを取得し、ローカルへ保存

    ```sh
    # CSVを取得
    bun scripts/fetch-csv-from-sheets.ts

    # CSVを取得して変更を自動コミット
    bun run fetch-csv # -> bun scripts/fetch-csv-from-sheets.ts --commit
    ```

    取得後、GitのHEADとの差分を表で表示します。既存行は変更された列と変更前後の値、追加・削除行は行番号と先頭列の値を表示します。取得前からある未コミットのCSV変更も含みます。GitHub Actionsでは同じ差分表をPR本文に載せ、既存PRの本文も更新します。PR本文が大きい場合は表を途中で省略するため、全差分はActionsのログかPRのFiles changedで確認してください。

- ローカルのCSVをGoogle スプレッドシートへ反映
    ```sh
    # 全CSVの差分を確認（書き込みなし）
    bun run push-csv --dry-run

    # 全CSVの差分を表示し、確認後に反映
    bun run push-csv

    # ローカルの空セルでリモートの値を消去。未指定時は空セルはスキップ
    bun run push-csv --overwrite-empty

    # シート名で対象を指定（複数指定可）
    bun run push-csv フレンズデータ
    ```

CSVとSheetsの行は、フレンズの `ID`、フォトの `フォト名`、イベントの `イベント名` と `開催開始`、状態異常スキルの `フレンズID/フォト名`・`わざ種別`・`状態異常`・`効果種別`・`威力`・`対象`、スキル別一覧の `フレンズID`・`わざ種別`・`効果種別`・`威力`、掛け合い一覧の `掛け合い元` で照合します。
掛け合い一覧は `掛け合い元` と `掛け合い先1`〜`掛け合い先14`（SheetsのD〜R列）を扱います。
既存・新規行とも数式は上書きしません。数式の計算結果がCSVと異なる場合は、Sheets上の数式や値を確認・修正してください。
中断後の再開時、Sheetsが日付・数値・割合を内部値へ変換しても、表示値が一致し数式でなければ反映済みとして照合します。

実行結果を確定できない場合や、中断後にCSV・Sheetsが変更された場合は停止します。その場合は表示された保存先の記録とSheetsを照合し、反映状況を確認してから `pending.json` と `journal.json` を削除して再実行してください。強制終了で `lock` が残った場合も、他の同期が実行中でないことを確認してから削除します。

### CSV行の原文取得

```sh
bun run get-csv-row --file csv/フレンズデータ.csv --key '{"ID":"シロツチノコ"}' --format json
bun run get-csv-row --file csv/イベントデータ.csv --key '{"イベント名":"対象名","開催開始":"CSVと同じ文字列"}' --format tsv
```

`--key` で指定した1行を、CSVの文字列と列順を保ったまま標準出力に出力します。JSONには列名の `headers`、1始まりの行番号 `rowNumber`、配列の `values`、列名で引ける `record` が入ります。改行やタブを含むセルはJSON形式で出力してください。ファイルに保存する場合はシェルのリダイレクトを使用します。既存ファイルの上書きに注意してください。

### CSVの値変更

```sh
bun run update-csv-row --file csv/フレンズデータ.csv --key '{"ID":"シロツチノコ"}' --set '{"特別衣装数":"2"}'
bun run update-csv-row --file csv/フレンズデータ.csv --key '{"ID":"シロツチノコ"}' --set '{"特別衣装数":"2"}' --write
```

キーを完全一致する1行に限定し、指定列だけを文字列として変更します。複合キーと複数列を指定でき、空文字列も指定できます。既定は変更前後のJSONを表示するだけで、`--write` を指定した場合のみローカルCSVに書き込みます。一致行が0件・複数件の場合、未知の列名や文字列以外の値の場合は停止します。対象外セルと改行・引用形式は保持します。Google Sheetsへの反映は別操作です。

### CSVの入力規則検証

```sh
bun run validate-csv
bun run validate-csv csv/状態異常スキル一覧.csv
```

全CSVまたは指定したCSVを検証し、違反した行・列・値を表示します。空欄は許容し、Sheetsで入力拒否に設定された規則の違反はエラー、警告のみの規則の違反は警告として扱います。エラーがある場合は終了コード1を返します。既存データにも違反があるため、検証結果を確認してください。

規則は取得時点のSheetsの設定を `scripts/csv-validation-rules.json` に保存したものです。Sheetsの設定変更時はこのファイルも更新してください。範囲参照はローカルのフレンズID・フォト名を参照します。Sheetsの規則が設定されていないCSV・列には値の制限を設けません。列単位で検証するため、Sheets上で設定範囲外の行にも同じ規則を適用します。

`update-csv-row` は変更セル、`push-csv` はSheetsに書き込むセルを検証し、エラーがあれば書き込み前に停止します。警告は表示しますが書き込みを妨げません。

### デプロイ

[GitHub](https://github.com/reamkf/wiki-nanodesu) のmainブランチへpushすると、GitHub Actionsにより自動でGitHub Pagesへデプロイされます。

- [ワークフローファイル](https://github.com/reamkf/wiki-nanodesu/blob/main/.github/workflows/nextjs.yml)
- [ワークフロー実行ログ](https://github.com/reamkf/wiki-nanodesu/actions/workflows/nextjs.yml)
