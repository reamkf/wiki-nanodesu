#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import { parseCsv, selectRow } from "./csv-rows";

// CSVの各フィールドの位置を記録し、変更対象以外の書式を保持する。
function fieldSpans(text: string): [number, number][][] {
	const rows: [number, number][][] = [[]];
	let start = text.startsWith("\uFEFF") ? 1 : 0;
	let quoted = false;
	for (let i = start; i < text.length; i++) {
		const c = text[i];
		if (c === '"' && (quoted || i === start)) {
			if (quoted && text[i + 1] === '"') i++;
			else quoted = !quoted;
		} else if (!quoted && (c === "," || c === "\n" || c === "\r")) {
			rows[rows.length - 1].push([start, i]);
			if (c !== ",") {
				if (c === "\r" && text[i + 1] === "\n") i++;
				rows.push([]);
			}
			start = i + 1;
		}
	}
	if (start < text.length || (text.length > 0 && text[text.length - 1] === ",")) {
		rows[rows.length - 1].push([start, text.length]);
	}
	if (!rows[rows.length - 1].length) rows.pop();
	return rows;
}

export function main(args = process.argv.slice(2)): void {
	if (args.includes("--help")) {
		console.log(
			"Usage: update-csv-row --file <CSV> --key '<JSON object>' --set '<JSON object>' [--write]",
		);
		return;
	}
	const options = new Map<string, string>();
	let write = false;
	for (let i = 0; i < args.length; i++) {
		const name = args[i];
		if (name === "--write" && !write) {
			write = true;
			continue;
		}
		if (
			!["--file", "--key", "--set"].includes(name) ||
			options.has(name) ||
			!args[i + 1] ||
			args[i + 1].startsWith("--")
		)
			throw new Error(`不正な引数: ${name}`);
		options.set(name, args[++i]);
	}
	const file = options.get("--file");
	const key = options.get("--key");
	const set = options.get("--set");
	if (!file || !key || !set) throw new Error("--file、--key、--setを指定してください。");
	const text = readFileSync(file, "utf8");
	const rows = parseCsv(text);
	const row = selectRow(rows, JSON.parse(key));
	const values: unknown = JSON.parse(set);
	if (
		!values ||
		typeof values !== "object" ||
		Array.isArray(values) ||
		!Object.keys(values).length ||
		Object.entries(values).some(
			([name, value]) => !row.headers.includes(name) || typeof value !== "string",
		)
	)
		throw new Error("--setには既知の列名と文字列値を指定してください。");
	const spans = fieldSpans(text);
	if (
		spans.length !== rows.length ||
		spans.some((fields, index) => fields.length !== rows[index].length)
	)
		throw new Error("CSVのフィールド位置を特定できません。");
	const changes = Object.entries(values)
		.map(([name, value]) => ({
			column: name,
			before: row.record[name],
			after: value as string,
		}))
		.filter((change) => change.before !== change.after);
	let result = text;
	for (const change of changes.toSorted(
		(a, b) => row.headers.indexOf(b.column) - row.headers.indexOf(a.column),
	)) {
		const [start, end] = spans[row.rowNumber - 1][row.headers.indexOf(change.column)];
		const value = /[",\r\n]/.test(change.after)
			? `"${change.after.replaceAll('"', '""')}"`
			: change.after;
		result = result.slice(0, start) + value + result.slice(end);
	}
	if (write && changes.length) writeFileSync(file, result, "utf8");
	console.log(
		JSON.stringify({ rowNumber: row.rowNumber, changes, written: write && changes.length > 0 }),
	);
}

if (import.meta.main) {
	try {
		main();
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
