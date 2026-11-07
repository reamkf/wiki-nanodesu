import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./csv-rows";
import rules from "./csv-validation-rules.json";

type Rule = { strict: boolean; values?: string[]; source?: string };
export type Violation = { row: number; column: string; value: string; strict: boolean };
const csvDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "csv");

export function validateCsv(
	file: string,
	rows: string[][],
	selected?: Map<number, Set<string>>,
): Violation[] {
	const columns = (rules as Record<string, Record<string, Rule>>)[basename(file, ".csv")];
	if (!columns) throw new Error(`入力規則の対象外のCSVです: ${file}`);
	const sources = new Map<string, Set<string>>();
	function source(name: string): Set<string> {
		const cached = sources.get(name);
		if (cached) return cached;
		const values = new Set<string>();
		for (const [filename, header] of name === "friends"
			? [["フレンズデータ", "ID"]]
			: [
					["フレンズデータ", "ID"],
					["フォトデータ", "フォト名"],
				]) {
			const data = parseCsv(readFileSync(join(csvDirectory, `${filename}.csv`), "utf8"));
			const index = data[0].indexOf(header);
			if (index < 0) throw new Error(`${filename}: ${header}列がありません。`);
			for (const row of data.slice(1)) if (row[index]) values.add(row[index]);
		}
		sources.set(name, values);
		return values;
	}
	const checks = Object.entries(columns).map(([column, rule]) => {
		const index = rows[0].indexOf(column);
		if (index < 0 || rows[0].lastIndexOf(column) !== index)
			throw new Error(`${file}: ${column}列がないか重複しています。`);
		return {
			column,
			index,
			strict: rule.strict,
			allowed: rule.values ? new Set(rule.values) : source(rule.source!),
		};
	});
	const violations: Violation[] = [];
	for (let i = 1; i < rows.length; i++) {
		for (const check of checks) {
			if (selected && !selected.get(i + 1)?.has(check.column)) continue;
			const value = rows[i][check.index];
			if (value && !check.allowed.has(value))
				violations.push({ row: i + 1, column: check.column, value, strict: check.strict });
		}
	}
	return violations;
}

export function reportViolations(file: string, violations: Violation[]): void {
	for (const v of violations)
		console.error(
			`${v.strict ? "エラー" : "警告"}: ${file}:${v.row} ${v.column} = ${JSON.stringify(v.value)}`,
		);
	if (violations.some((v) => v.strict)) throw new Error(`${file}: 入力規則に違反しています。`);
}
