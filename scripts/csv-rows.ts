import Papa from "papaparse";
import type { SheetConfig } from "./fetch-csv-from-sheets";

export function parseCsv(
	text: string,
	config?: Pick<SheetConfig, "filePath" | "range">,
): string[][] {
	const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, "").replace(/\r?\n$/, ""), {
		delimiter: ",",
		skipEmptyLines: false,
	});
	const label = config?.filePath ?? "CSV";
	if (result.errors.length > 0 || !text.trim())
		throw new Error(`${label}: 空または不正なCSVです。`);
	const width = config?.range?.endColumn
		? config.range.endColumn - (config.range.startColumn ?? 1) + 1
		: result.data[0].length;
	if (result.data.some((row) => row.length !== width))
		throw new Error(`${label}: 列数が一致しません（期待値: ${width}）。`);
	return result.data;
}

export interface CsvRow {
	headers: string[];
	rowNumber: number;
	values: string[];
	record: Record<string, string>;
}

export function selectRow(rows: string[][], key: Record<string, string>): CsvRow {
	const headers = rows[0];
	if (!headers || headers.some((header) => !header) || new Set(headers).size !== headers.length) {
		throw new Error("ヘッダーが空または重複しています。");
	}
	if (
		!key ||
		Array.isArray(key) ||
		typeof key !== "object" ||
		!Object.keys(key).length ||
		Object.entries(key).some(
			([name, value]) => !headers.includes(name) || typeof value !== "string",
		)
	) {
		throw new Error("キーには既知の列名と文字列値を指定してください。");
	}
	const indices = Object.entries(key).map(
		([name, value]) => [headers.indexOf(name), value] as const,
	);
	const matches = rows
		.slice(1)
		.flatMap((values, index) =>
			indices.every(([column, value]) => values[column] === value)
				? [
						{
							headers,
							rowNumber: index + 2,
							values,
							record: Object.fromEntries(
								headers.map((name, column) => [name, values[column]]),
							),
						},
					]
				: [],
		);
	if (matches.length !== 1) throw new Error(`一致する行は1件必要です（${matches.length}件）。`);
	return matches[0];
}

export function rowToTsv(row: CsvRow): string {
	if (row.values.some((value) => /[\t\r\n]/.test(value)))
		throw new Error("タブ・セル内改行を含む行はTSVへ出力できません。");
	return row.values.join("\t");
}
