import path from "path";
import fs from "fs";

/**
 * Next.js SSG ビルド出力（out/）の静的ファイルサーバー
 *
 * Next.jsの basePath: "/wiki-nanodesu" に対応するため、
 * リクエストURLから /wiki-nanodesu プレフィックスを除去して out/ から配信する。
 */

const BASE_PATH = "/wiki-nanodesu";
const PORT = 3333;
const projectRoot = path.resolve(import.meta.dirname, "..");
const outDir = path.join(projectRoot, "out");

if (!fs.existsSync(outDir)) {
	console.error(
		"out/ ディレクトリが見つかりません。先に `bun run build` を実行してください。"
	);
	process.exit(1);
}

/** Content-Type を拡張子から判定する */
function getContentType(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	const mimeTypes: Record<string, string> = {
		".html": "text/html; charset=utf-8",
		".css": "text/css; charset=utf-8",
		".js": "application/javascript; charset=utf-8",
		".json": "application/json; charset=utf-8",
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".ico": "image/x-icon",
		".webp": "image/webp",
		".woff": "font/woff",
		".woff2": "font/woff2",
		".txt": "text/plain; charset=utf-8",
		".xml": "application/xml; charset=utf-8",
		".webmanifest": "application/manifest+json; charset=utf-8",
	};
	return mimeTypes[ext] ?? "application/octet-stream";
}

/**
 * リクエストパスを out/ ディレクトリ内のファイルパスに解決する。
 * - /wiki-nanodesu プレフィックスを除去
 * - ディレクトリの場合は index.html を返す
 * - 拡張子なしの場合は .html を付与
 */
function resolveFilePath(urlPath: string): string | null {
	// basePath プレフィックスを除去
	let relativePath: string;
	if (urlPath === BASE_PATH || urlPath.startsWith(BASE_PATH + "/")) {
		relativePath = urlPath.slice(BASE_PATH.length) || "/";
	} else {
		// basePath なしのリクエストは 404
		return null;
	}

	// パストラバーサル防止
	const resolved = path.resolve(outDir, "." + relativePath);
	if (!resolved.startsWith(outDir)) {
		return null;
	}

	// ファイルが直接存在する場合
	if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
		return resolved;
	}

	// ディレクトリの場合は index.html を試行
	if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
		const indexPath = path.join(resolved, "index.html");
		if (fs.existsSync(indexPath)) {
			return indexPath;
		}
	}

	// 拡張子なしの場合は .html を付与
	const htmlPath = resolved + ".html";
	if (fs.existsSync(htmlPath)) {
		return htmlPath;
	}

	return null;
}

const server = Bun.serve({
	port: PORT,
	fetch(req) {
		const url = new URL(req.url);
		const filePath = resolveFilePath(url.pathname);

		if (!filePath) {
			// 404 の場合は Next.js の 404 ページを返す
			const notFoundPath = path.join(outDir, "404.html");
			if (fs.existsSync(notFoundPath)) {
				return new Response(Bun.file(notFoundPath), {
					status: 404,
					headers: { "Content-Type": "text/html; charset=utf-8" },
				});
			}
			return new Response("Not Found", { status: 404 });
		}

		return new Response(Bun.file(filePath), {
			headers: { "Content-Type": getContentType(filePath) },
		});
	},
});

console.log(`Server listening on http://localhost:${server.port}`);
