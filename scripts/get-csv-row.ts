#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { parseCsv, rowToTsv, selectRow } from "./csv-rows";

export function main(args = process.argv.slice(2)): void {
	if (args.includes("--help")) {
		console.log(
			"Usage: get-csv-row --file <CSV> --key '<JSON object>' [--format json|tsv]",
		);
		return;
	}
	const options = new Map<string, string>();
	for (let i = 0; i < args.length; i++) {
		const name = args[i];
		if (
			!["--file", "--key", "--format"].includes(name) ||
			options.has(name) ||
			!args[i + 1] ||
			args[i + 1].startsWith("--")
		)
			throw new Error(`不正な引数: ${name}`);
		options.set(name, args[++i]);
	}
	const file = options.get("--file");
	const key = options.get("--key");
	const format = options.get("--format") ?? "json";
	if (!file || !key || !["json", "tsv"].includes(format))
		throw new Error("--file、--keyとjson|tsv形式を指定してください。");
	const row = selectRow(parseCsv(readFileSync(file, "utf8")), JSON.parse(key));
	const content = format === "json" ? JSON.stringify(row) + "\n" : rowToTsv(row);
	process.stdout.write(content);
}

if (import.meta.main) {
	try {
		main();
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
