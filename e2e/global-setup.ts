import fs from "fs";
import path from "path";

/**
 * E2Eテスト用のセットアップ。
 *
 * ビルド出力（out/）の存在を確認する。
 * 静的ファイルの配信は e2e/serve.ts の Bun.serve() で行い、
 * basePath "/wiki-nanodesu" のパス解決もサーバー側で処理する。
 */
export default async function globalSetup() {
	const projectRoot = path.resolve(import.meta.dirname, "..");
	const outDir = path.join(projectRoot, "out");

	// out/ ディレクトリが存在するか確認
	if (!fs.existsSync(outDir)) {
		throw new Error(
			"out/ ディレクトリが見つかりません。先に `bun run build` を実行してください。"
		);
	}
}
