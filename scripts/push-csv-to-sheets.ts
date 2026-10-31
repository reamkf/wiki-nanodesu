#!/usr/bin/env bun

import { createReadStream, readFileSync } from "fs";
import { JWT } from "google-auth-library";
import Papa from "papaparse";
import {
	generateA1Notation,
	sheetConfigs,
	SPREADSHEET_ID,
	type SheetConfig,
} from "./fetch-csv-from-sheets";

export function parseCsv(text: string, config: SheetConfig): string[][] {
	const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, "").replace(/\r?\n$/, ""), {
		delimiter: ",",
		skipEmptyLines: false,
	});
	if (result.errors.length > 0 || !text.trim()) {
		throw new Error(`${config.filePath}: 空または不正なCSVです。`);
	}
	const width = config.range?.endColumn
		? config.range.endColumn - (config.range.startColumn ?? 1) + 1
		: result.data[0].length;
	if (result.data.some((row) => row.length !== width)) {
		throw new Error(`${config.filePath}: 列数が一致しません（期待値: ${width}）。`);
	}
	return result.data;
}

export function createUpdates(
	config: SheetConfig,
	local: string[][],
	remote: string[][],
	skipEmpty = true,
	formulaCells: Set<string> = new Set(),
) {
	const width = config.range?.endColumn
		? config.range.endColumn - (config.range.startColumn ?? 1) + 1
		: Math.max(local[0].length, ...remote.map((row) => row.length));
	const updates: { range: string; values: string[][] }[] = [];
	for (let row = 0; row < Math.max(local.length, remote.length); row++) {
		for (let col = 0; col < width; col++) {
			if (
				formulaCells.has(
					`${row + (config.range?.startRow ?? 1)}:${col + (config.range?.startColumn ?? 1)}`,
				)
			)
				continue;
			const value = local[row]?.[col] ?? "";
			if (skipEmpty && value === "") continue;
			if (value === (remote[row]?.[col] ?? "")) continue;
			let column = col + (config.range?.startColumn ?? 1);
			let letters = "";
			while (column > 0) {
				column--;
				letters = String.fromCharCode(65 + (column % 26)) + letters;
				column = Math.floor(column / 26);
			}
			const sheet = config.sheetName.replace(/'/g, "''");
			updates.push({
				range: `'${sheet}'!${letters}${row + (config.range?.startRow ?? 1)}`,
				values: [[value]],
			});
		}
	}
	return updates;
}

type SheetGrid = {
	properties: { title: string };
	data?: {
		startRow?: number;
		startColumn?: number;
		rowData?: { values?: { userEnteredValue?: { formulaValue?: string } }[] }[];
	}[];
};

export function getFormulaCells(sheet: SheetGrid): Set<string> {
	const cells = new Set<string>();
	for (const block of sheet.data ?? []) {
		for (const [row, data] of (block.rowData ?? []).entries()) {
			for (const [col, cell] of (data.values ?? []).entries()) {
				if (cell.userEnteredValue?.formulaValue) {
					cells.add(
						`${(block.startRow ?? 0) + row + 1}:${(block.startColumn ?? 0) + col + 1}`,
					);
				}
			}
		}
	}
	return cells;
}

export async function getSheetsAccessToken(
	env: Record<string, string | undefined> = process.env,
): Promise<string> {
	if (!env.GOOGLE_APPLICATION_CREDENTIALS) {
		throw new Error("GOOGLE_APPLICATION_CREDENTIALSを設定してください。");
	}
	const auth = new JWT({
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});
	await auth.fromStream(createReadStream(env.GOOGLE_APPLICATION_CREDENTIALS));
	const { token } = await auth.getAccessToken();
	if (!token) throw new Error("サービスアカウントのアクセストークンを取得できませんでした。");
	return token;
}

export async function main(args = process.argv.slice(2)): Promise<void> {
	const dryRun = args.includes("--dry-run");
	if (args.includes("--skip-empty") && args.includes("--overwrite-empty")) {
		throw new Error("--skip-emptyと--overwrite-emptyは同時に指定できません。");
	}
	const skipEmpty = !args.includes("--overwrite-empty");
	const names = args.filter(
		(arg) => !["--dry-run", "--skip-empty", "--overwrite-empty"].includes(arg),
	);
	for (const name of names) {
		if (!sheetConfigs.some((config) => config.sheetName === name)) {
			throw new Error(`不明なシート名: ${name}`);
		}
	}
	const configs = sheetConfigs.filter(
		(config) => names.length === 0 || names.includes(config.sheetName),
	);
	// 全ファイルを検証してからAPIへアクセスする。
	const files = configs.map((config) => ({
		config,
		values: parseCsv(readFileSync(config.filePath, "utf8"), config),
	}));
	const token = await getSheetsAccessToken();
	const base = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
	async function request(url: string, body?: unknown) {
		const response = await fetch(url, {
			method: body ? "POST" : "GET",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: body ? JSON.stringify(body) : undefined,
		});
		if (!response.ok) {
			throw new Error(`Google Sheets APIエラー: ${response.status} ${await response.text()}`);
		}
		return response.json();
	}
	const query = new URLSearchParams({ valueRenderOption: "FORMATTED_VALUE" });
	for (const { config } of files)
		query.append("ranges", generateA1Notation(config.sheetName, config));
	const remote = (await request(`${base}/values:batchGet?${query}`)) as {
		valueRanges: { values?: string[][] }[];
	};
	const gridQuery = new URLSearchParams({
		includeGridData: "true",
		fields: "sheets(properties(title),data(startRow,startColumn,rowData(values(userEnteredValue))))",
	});
	for (const { config } of files)
		gridQuery.append("ranges", generateA1Notation(config.sheetName, config));
	const grid = (await request(`${base}?${gridQuery}`)) as { sheets: SheetGrid[] };
	const data = files.flatMap(({ config, values }, index) => {
		const sheet = grid.sheets.find((sheet) => sheet.properties.title === config.sheetName);
		if (!sheet) throw new Error(`数式情報を取得できませんでした: ${config.sheetName}`);
		const updates = createUpdates(
			config,
			values,
			remote.valueRanges[index].values ?? [],
			skipEmpty,
			getFormulaCells(sheet),
		);
		console.log(`${config.sheetName}: ${updates.length}セルの差分`);
		return updates;
	});
	if (!dryRun && data.length > 0) {
		await request(`${base}/values:batchUpdate`, { valueInputOption: "RAW", data });
	}
	console.log(dryRun ? "確認のみ完了（書き込みなし）。" : "CSVの反映が完了しました。");
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
