import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseCsv, rowToTsv, selectRow } from "../../../scripts/csv-rows";

describe("CSV行エクスポート", () => {
	test("複合キーと原文・列順・末尾空欄を保持する", () => {
		const rows = parseCsv(
			'\uFEFF名前,開始,値,末尾\r\n同名,001,"全角ＵＭＡ~~5.0%""引用",\r\n同名,002,別,\r\n',
		);
		const row = selectRow(rows, { 名前: "同名", 開始: "001" });
		expect(row).toEqual({
			headers: ["名前", "開始", "値", "末尾"],
			rowNumber: 2,
			values: ["同名", "001", '全角ＵＭＡ~~5.0%"引用', ""],
			record: { 名前: "同名", 開始: "001", 値: '全角ＵＭＡ~~5.0%"引用', 末尾: "" },
		});
		expect(rowToTsv(row)).toBe('同名\t001\t全角ＵＭＡ~~5.0%"引用\t');
	});
	test("曖昧なキー・未知列・空キー・ヘッダー重複を拒否する", () => {
		const rows = parseCsv("名前,値\nA,1\nA,2");
		const keys: Record<string, string>[] = [{ 名前: "A" }, { 名前: "B" }, { 未知: "A" }, {}];
		for (const key of keys) expect(() => selectRow(rows, key)).toThrow();
		expect(() => selectRow(parseCsv("名前,名前\nA,B"), { 名前: "A" })).toThrow();
	});
	test("JSONではセル内改行を保持しTSVでは拒否する", () => {
		for (const value of ["複数\n行", "実\tタブ"]) {
			const row = selectRow(parseCsv(`ID,本文\na,"${value}"`), { ID: "a" });
			expect(JSON.parse(JSON.stringify(row)).record.本文).toBe(value);
			expect(() => rowToTsv(row)).toThrow();
		}
	});
	test("CLIは指定行を標準出力に返す", async () => {
		const directory = mkdtempSync(join(tmpdir(), "csv-rows-"));
		try {
			const file = join(directory, "input.csv");
			const source = "ID,値,末尾\n001,日本語,\n";
			writeFileSync(file, source);
			const args = [
				process.execPath,
				resolve("scripts/get-csv-row.ts"),
				"--file",
				file,
				"--key",
				'{"ID":"001"}',
			];
			const child = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
			const [status, stdout] = await Promise.all([
				child.exited,
				new Response(child.stdout).text(),
			]);
			expect(status).toBe(0);
			expect(JSON.parse(stdout).values).toEqual(["001", "日本語", ""]);
		} finally {
			rmSync(directory, { recursive: true });
		}
	});
});
