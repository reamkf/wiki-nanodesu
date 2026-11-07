#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { sheetConfigs } from "./fetch-csv-from-sheets";
import { parseCsv } from "./csv-rows";
import { reportViolations, validateCsv } from "./csv-validation";

const args = process.argv.slice(2);
if (args.includes("--help")) {
	console.log("Usage: bun run validate-csv [CSV files...]");
} else {
	let failed = false;
	for (const file of args.length ? args : sheetConfigs.map((config) => config.filePath)) {
		try {
			const rows = parseCsv(readFileSync(file, "utf8"));
			reportViolations(file, validateCsv(file, rows));
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			failed = true;
		}
	}
	if (failed) process.exitCode = 1;
}
