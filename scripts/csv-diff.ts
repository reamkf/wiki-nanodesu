import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import Papa from "papaparse";
import { KEY_HEADERS, percentValuesEqual } from "./sheets-sync-plan";

function git(...args: string[]): string {
	return execFileSync("git", args, { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 });
}

function escapeCell(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\|/g, "&#124;")
		.replace(/\\/g, "&#92;")
		.replace(/\r\n|\r|\n/g, "<br>");
}

function rows(text: string): string[][] {
	if (!text) return [];
	const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, "").replace(/\r?\n$/, ""));
	if (result.errors.length) throw new Error(`CSVの解析に失敗しました: ${result.errors[0].message}`);
	return result.data;
}

export function csvDiffReport(prBody = false): string {
	const files = git("diff", "HEAD", "--no-renames", "--name-only", "-z", "--", "csv/*.csv")
		.split("\0")
		.filter(Boolean);
	if (files.length === 0) return "CSVに差分はありません。\n";
	const lines = [
		...(prBody
			? ["Google SheetsからCSVファイルを自動取得したのです。差分を確認してマージしてほしいのです。", ""]
			: []),
		"| ファイル | 行 | 変更 | 列 | 変更前 | 変更後 |",
		"| --- | --- | --- | --- | --- | --- |",
	];
	let bytes = Buffer.byteLength(`${lines.join("\n")}\n`);
	let truncated = false;
	function add(values: string[]): void {
		if (truncated) return;
		const line = `| ${values.map(escapeCell).join(" | ")} |`;
		const size = Buffer.byteLength(`${line}\n`);
		if (prBody && bytes + size > 60000) {
			truncated = true;
			return;
		}
		lines.push(line);
		bytes += size;
	}
	for (const file of files) {
		const old = rows(git("ls-tree", "--name-only", "HEAD", "--", file) ? git("show", `HEAD:${file}`) : "");
		const current = rows(existsSync(file) ? readFileSync(file, "utf8") : "");
		const headers = current[0] ?? old[0] ?? [];
		const name = basename(file, ".csv");
		const keys = KEY_HEADERS[name] ?? (name === "フォト火力データ" ? ["フォトID", "変化前・後", "条件"] : [headers[0]]);
		// 行ラベルには識別キーの先頭列を使う（フォトデータの先頭列はレア度のため）
		const labelColumn = keys.find((column) => headers.includes(column)) ?? headers[0];
		const key = (row: string[], header: string[]) => {
			const values = keys.map((column) => row[header.indexOf(column)] ?? "");
			return values.every(Boolean) ? JSON.stringify(values) : undefined;
		};
		const oldByKey = new Map<string, number[]>();
		for (let i = 1; i < old.length; i++) {
			const value = key(old[i], old[0]);
			if (value) {
				const indices = oldByKey.get(value) ?? [];
				indices.push(i);
				oldByKey.set(value, indices);
			}
		}
		const matches = new Map<number, number>();
		const used = new Set<number>();
		for (let i = 1; i < current.length; i++) {
			const value = key(current[i], current[0]);
			const index = value ? oldByKey.get(value)?.shift() : undefined;
			if (index !== undefined) { matches.set(i, index); used.add(index); }
		}
		// 識別キー自体の変更も、前後の行で一意に挟まれた場合は更新として扱う。
		for (let i = 1; i < current.length; i++) {
			if (matches.has(i) || used.has(i) || i >= old.length) continue;
			const before = i === 1 || matches.get(i - 1) === i - 1;
			const after = (i === current.length - 1 && i === old.length - 1) || matches.get(i + 1) === i + 1;
			if (before && after) { matches.set(i, i); used.add(i); }
		}
		function compare(previous: string[], next: string[], label: string): void {
			for (let column = 0; column < Math.max(previous.length, next.length); column++) {
				const before = previous[column] ?? "";
				const after = next[column] ?? "";
				// 5%と5.0%のような表記ゆれは差分として扱わない。
				if (before === after || percentValuesEqual(before, after)) continue;
				add([file, label, "更新", headers[column] || `列${column + 1}`, before, after]);
			}
		}
		if (old.length && current.length) compare(old[0], current[0], "ヘッダー");
		for (let i = 1; i < current.length; i++) {
			const index = matches.get(i);
			const label = `${i + 1}行目: ${current[i][headers.indexOf(labelColumn)] ?? ""}`;
			if (index === undefined) add([file, label, "追加", "", "", ""]);
			else compare(old[index], current[i], label);
		}
		for (let i = 1; i < old.length; i++) {
			if (!used.has(i)) add([file, `${i + 1}行目: ${old[i][headers.indexOf(labelColumn)] ?? ""}`, "削除", "", "", ""]);
		}
		if (truncated) break;
	}
	if (truncated) lines.push("", "差分が大きいため表を途中で省略しました。全差分はFiles changedまたは実行ログを確認してください。");
	return `${lines.join("\n")}\n`;
}

if (import.meta.main) process.stdout.write(csvDiffReport(process.argv.includes("--pr-body")));
