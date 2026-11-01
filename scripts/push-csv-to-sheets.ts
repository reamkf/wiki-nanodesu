#!/usr/bin/env bun
import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { getSheetsAccessToken } from "./sheets-auth";
import { parseCsv } from "./csv-rows";
import {
	generateA1Notation,
	sheetConfigs,
	SPREADSHEET_ID,
	type SheetConfig,
} from "./fetch-csv-from-sheets";
import {
	createSheetPlan,
	normalizeSnapshot,
	validateSyncPlan,
	type SheetSnapshot,
	type SyncPlan,
} from "./sheets-sync-plan";
import { applySyncPlan } from "./sheets-sync-apply";

type CellValue = { stringValue?: string; numberValue?: number; boolValue?: boolean };
type GridCell = {
	formattedValue?: string;
	effectiveValue?: CellValue;
	userEnteredValue?: CellValue & { formulaValue?: string };
};
type GridResponse = {
	sheets?: {
		properties: { sheetId: number; title: string; gridProperties: { rowCount: number } };
		data?: { startRow?: number; startColumn?: number; rowData?: { values?: GridCell[] }[] }[];
	}[];
};
type Request = (suffix: string, body?: unknown) => Promise<unknown>;

export async function readSnapshot(config: SheetConfig, request: Request): Promise<SheetSnapshot> {
	const query = new URLSearchParams({
		includeGridData: "true",
		ranges: generateA1Notation(config.sheetName, config),
		fields: "sheets(properties(sheetId,title,gridProperties(rowCount)),data(startRow,startColumn,rowData(values(formattedValue,effectiveValue,userEnteredValue))))",
	});
	const response = (await request(`?${query}`)) as GridResponse;
	const sheet = response.sheets?.find((entry) => entry.properties.title === config.sheetName);
	if (!sheet) throw new Error(`シート情報を取得できませんでした: ${config.sheetName}`);
	const snapshot: SheetSnapshot = {
		sheetId: sheet.properties.sheetId,
		rowCount: sheet.properties.gridProperties.rowCount,
		formatted: [],
		raw: [],
		formulas: [],
	};
	const rowOffset = (config.range?.startRow ?? 1) - 1;
	const columnOffset = (config.range?.startColumn ?? 1) - 1;
	for (const block of sheet.data ?? []) {
		for (const [index, row] of (block.rowData ?? []).entries()) {
			const r = (block.startRow ?? 0) + index - rowOffset;
			if (r < 0) continue;
			snapshot.formatted[r] ??= [];
			snapshot.raw[r] ??= [];
			snapshot.formulas[r] ??= [];
			for (const [index, cell] of (row.values ?? []).entries()) {
				const c = (block.startColumn ?? 0) + index - columnOffset;
				if (c < 0) continue;
				snapshot.formatted[r][c] = cell.formattedValue ?? "";
				const value = cell.effectiveValue;
				snapshot.raw[r][c] =
					value?.stringValue ?? value?.numberValue ?? value?.boolValue ?? "";
				snapshot.formulas[r][c] = cell.userEnteredValue?.formulaValue ?? "";
			}
		}
	}
	return normalizeSnapshot(snapshot);
}

export async function main(
	args = process.argv.slice(2),
	dependencies?: {
		request: Request;
		confirm?: (question: string) => Promise<boolean>;
		stateDirectory?: string;
	},
): Promise<void> {
	if (args.includes("--help")) {
		console.log("Usage: push-csv [sheet names] [--dry-run] [--overwrite-empty]");
		console.log("差分を表示し、確認後に反映します。--dry-run は確認のみです。");
		return;
	}
	let dryRun = false,
		overwriteEmpty = false,
		skipEmpty = false;
	const names: string[] = [];
	for (const arg of args) {
		if (arg === "--dry-run") dryRun = true;
		else if (arg === "--overwrite-empty") overwriteEmpty = true;
		else if (arg === "--skip-empty") skipEmpty = true;
		else if (arg.startsWith("--")) throw new Error(`不明なオプション: ${arg}`);
		else names.push(arg);
	}
	if (overwriteEmpty && skipEmpty)
		throw new Error("--skip-emptyと--overwrite-emptyは同時に指定できません。");
	for (const name of names)
		if (!sheetConfigs.some((config) => config.sheetName === name))
			throw new Error(`不明なシート名: ${name}`);
	const configs = sheetConfigs.filter(
		(config) => !names.length || names.includes(config.sheetName),
	);
	const directory =
		dependencies?.stateDirectory ??
		join(
			process.env.XDG_STATE_HOME || join(homedir(), ".local", "state"),
			"wiki-nanodesu",
			"sheets-sync",
			SPREADSHEET_ID,
		);
	const pendingPath = join(directory, "pending.json");
	const journalPath = join(directory, "journal.json");
	const lockPath = join(directory, "lock");
	let lock: number | undefined;
	if (!dryRun) {
		mkdirSync(directory, { recursive: true, mode: 0o700 });
		try {
			lock = openSync(lockPath, "wx", 0o600);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
			throw new Error(
				`別の同期が実行中、または前回が強制終了されています。実行中でないことを確認してロックを削除してください: ${lockPath}`,
			);
		}
	}
	try {
		let plan: SyncPlan | undefined;
		if (!dryRun && !existsSync(pendingPath) && existsSync(journalPath)) {
			const previous = JSON.parse(readFileSync(journalPath, "utf8")) as {
				completed?: boolean;
			};
			if (previous.completed !== true)
				throw new Error(
					`未完了の実行記録があります。Sheetsの反映状況と記録を確認してください: ${directory}`,
				);
			unlinkSync(journalPath);
		}
		if (existsSync(pendingPath)) {
			const saved: unknown = JSON.parse(readFileSync(pendingPath, "utf8"));
			validateSyncPlan(saved);
			plan = saved;
			if (
				plan.spreadsheetId !== SPREADSHEET_ID ||
				JSON.stringify(plan.sheets.map((sheet) => sheet.config)) !==
					JSON.stringify(configs) ||
				plan.sheets.some((sheet) => sheet.overwriteEmpty !== overwriteEmpty)
			)
				throw new Error(
					`未完了の同期があります。同じシート・オプションで再実行してください。実行記録: ${directory}`,
				);
			console.log(
				"前回の未完了の同期を確認します。以下は前回の変更全体です。適用済みの操作は再送しません。",
			);
		}
		const files = configs.map((config) => {
			const source = readFileSync(config.filePath, "utf8");
			return {
				config,
				local: parseCsv(source, config),
				csvHash: createHash("sha256").update(source).digest("hex"),
			};
		});
		function checkCsv(): void {
			for (const sheet of plan!.sheets) {
				const source = readFileSync(sheet.config.filePath, "utf8");
				if (createHash("sha256").update(source).digest("hex") !== sheet.csvHash)
					throw new Error(
						`確認後にCSVが変更されています: ${sheet.config.filePath}。未完了の同期がある場合はSheetsと実行記録を確認してください: ${directory}`,
					);
			}
		}
		if (plan) checkCsv();
		// 認証情報はAPIのヘッダーにだけ渡し、実行記録へ保存しない。
		let request = dependencies?.request;
		if (!request) {
			const token = await getSheetsAccessToken();
			const base = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
			request = async (suffix, body) => {
				const response = await fetch(base + suffix, {
					method: body === undefined ? "GET" : "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: body === undefined ? undefined : JSON.stringify(body),
				});
				if (!response.ok) throw new Error(`Google Sheets APIエラー: ${response.status}`);
				return response.json();
			};
		}
		const transport = request;
		if (!plan) {
			plan = { version: 1, spreadsheetId: SPREADSHEET_ID, sheets: [] };
			for (const file of files)
				plan.sheets.push(
					createSheetPlan(
						file.config,
						file.local,
						file.csvHash,
						await readSnapshot(file.config, transport),
						overwriteEmpty,
					),
				);
		}
		for (const sheet of plan.sheets) {
			const start = sheet.config.range?.startRow ?? 1;
			const columnStart = sheet.config.range?.startColumn ?? 1;
			const rows: (number | undefined)[] = sheet.base.formatted.map((_, index) => index);
			for (const insert of sheet.inserts)
				rows.splice(
					insert.rowIndex - start + 1,
					0,
					...Array<undefined>(insert.count).fill(undefined),
				);
			const added = new Set<number>();
			for (let index = 1; index < sheet.local.length; index++)
				if (rows[index] === undefined) added.add(index + start);
			const changed = sheet.comparisons.filter(
				(cell) => cell.kind === "different" && !added.has(cell.row),
			);
			console.log(
				`${sheet.config.sheetName}: 新規追加 ${added.size}行 / 既存セルの差分 ${changed.length}件`,
			);
			for (const row of added) {
				const values = sheet.local[row - start];
				console.log(
					`  追加 行${row}: ${JSON.stringify(
						Object.fromEntries(
							sheet.local[0]
								.map((header, column) => [header, values[column]])
								.filter(([, value]) => value !== ""),
						),
					)}`,
				);
			}
			for (const cell of changed)
				console.log(
					`  変更 行${cell.row} ${sheet.local[0][cell.column - columnStart]}: ${JSON.stringify(cell.remote)} → ${JSON.stringify(cell.local)}${cell.local === "" && !overwriteEmpty ? "（空欄のため消去しません）" : ""}`,
				);
			for (const cell of sheet.comparisons.filter(
				(cell) => cell.kind === "protected-formula-mismatch",
			))
				console.log(
					`  数式の不一致 行${cell.row} 列${cell.column}: Sheets ${JSON.stringify(cell.remote)} / CSV ${JSON.stringify(cell.local)}`,
				);
		}
		if (dryRun) {
			console.log("確認のみ完了（書き込みなし）。");
			return;
		}
		if (
			plan.sheets.some((sheet) =>
				sheet.comparisons.some((cell) => cell.kind === "protected-formula-mismatch"),
			)
		)
			throw new Error(
				"数式の計算結果がCSVと一致しません。Sheets上で確認・修正して再実行してください。書き込みは行っていません。",
			);
		if (
			plan.sheets.some((sheet) =>
				sheet.comparisons.some(
					(cell) => cell.kind === "different" && cell.local === "" && !overwriteEmpty,
				),
			)
		)
			throw new Error(
				"空欄の差分が残っています。消去する場合は --overwrite-empty を指定してください。書き込みは行っていません。",
			);
		if (
			!existsSync(pendingPath) &&
			!plan.sheets.some((sheet) => sheet.inserts.length || sheet.updates.length)
		) {
			console.log("差分はありません。");
			return;
		}
		const question = "この内容を反映しますか？ [y/N] ";
		let approved: boolean;
		if (dependencies?.confirm) approved = await dependencies.confirm(question);
		else {
			if (!process.stdin.isTTY || !process.stdout.isTTY)
				throw new Error(
					"反映には対話端末での確認が必要です。確認のみの場合は --dry-run を指定してください。",
				);
			const terminal = createInterface({ input: process.stdin, output: process.stdout });
			try {
				approved = /^(y|yes)$/i.test((await terminal.question(question)).trim());
			} finally {
				terminal.close();
			}
		}
		if (!approved) {
			console.log("中止しました（書き込みなし）。");
			return;
		}
		checkCsv();
		if (!existsSync(pendingPath))
			writeFileSync(pendingPath, JSON.stringify(plan) + "\n", { flag: "wx", mode: 0o600 });
		try {
			await applySyncPlan(plan, {
				readSnapshot: (config) => readSnapshot(config, transport),
				request: transport,
				journalPath,
			});
		} catch (error) {
			// 実行記録の確定前はAPIへ変更を送らないため、安全に再確認できる。
			if (!existsSync(journalPath)) {
				unlinkSync(pendingPath);
				throw error;
			}
			console.error(`同期が完了していません。実行記録: ${directory}`);
			console.error(
				"同じコマンドで再実行すると結果を照合します。記録を削除してやり直す前に、Sheetsの反映状況を確認してください。",
			);
			throw error;
		}
		// 完了済みのjournalを先に消すと、中断時に二重挿入する危険がある。
		unlinkSync(pendingPath);
		unlinkSync(journalPath);
		console.log("CSVの反映と読戻し確認が完了しました。");
	} finally {
		if (lock !== undefined) {
			closeSync(lock);
			unlinkSync(lockPath);
		}
	}
}

if (import.meta.main)
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
