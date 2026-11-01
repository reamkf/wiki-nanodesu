import { createHash } from "node:crypto";
import {
	closeSync,
	existsSync,
	fsyncSync,
	openSync,
	readFileSync,
	renameSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import type { SheetConfig } from "./fetch-csv-from-sheets";
import {
	compareSheet,
	normalizeSnapshot,
	snapshotsEqual,
	validateSyncPlan,
	type CellComparison,
	type SheetPlan,
	type SheetSnapshot,
	type SyncPlan,
} from "./sheets-sync-plan";

export interface ApplyOptions {
	readSnapshot: (config: SheetConfig) => Promise<SheetSnapshot>;
	request: (suffix: string, body: unknown) => Promise<unknown>;
	journalPath: string;
}

export interface ApplyResult {
	completed: true;
	resumed: boolean;
	comparisons: { sheetName: string; comparisons: CellComparison[] }[];
}

type PendingMutation =
	| { kind: "insert"; rowIndex: number; count: number }
	| { kind: "append"; count: number }
	| { kind: "raw"; data: { range: string; values: string[][] }[] };

type SheetProgress = {
	checkpoint: SheetSnapshot;
	insertIndex: number;
	rawDone: boolean;
	complete: boolean;
	pending?: PendingMutation;
};

type ApplyJournal = {
	version: 1;
	planHash: string;
	completed: boolean;
	sheets: SheetProgress[];
};

function saveJournal(path: string, journal: ApplyJournal): void {
	// intentも完了点も、API呼び出しより先にディスクへ確定する。
	const temporary = `${path}.${process.pid}.tmp`;
	const descriptor = openSync(temporary, "wx", 0o600);
	try {
		writeFileSync(descriptor, `${JSON.stringify(journal)}\n`);
		fsyncSync(descriptor);
	} finally {
		closeSync(descriptor);
	}
	try {
		renameSync(temporary, path);
		const directory = openSync(dirname(path), "r");
		try {
			fsyncSync(directory);
		} finally {
			closeSync(directory);
		}
	} finally {
		if (existsSync(temporary)) unlinkSync(temporary);
	}
}

function rowLength(snapshot: SheetSnapshot): number {
	return Math.max(snapshot.formatted.length, snapshot.raw.length, snapshot.formulas.length);
}

function width(plan: SheetPlan, ...snapshots: SheetSnapshot[]): number {
	if (plan.config.range?.endColumn !== undefined) {
		return plan.config.range.endColumn - (plan.config.range.startColumn ?? 1) + 1;
	}
	return Math.max(
		0,
		...plan.local.map((row) => row.length),
		...snapshots.flatMap((snapshot) =>
			[snapshot.formatted, snapshot.raw, snapshot.formulas].flatMap((rows) =>
				rows.map((row) => row.length),
			),
		),
	);
}

function sameCell(
	before: SheetSnapshot,
	oldRow: number,
	after: SheetSnapshot,
	newRow: number,
	column: number,
): boolean {
	const formula = before.formulas[oldRow]?.[column] ?? "";
	const nextFormula = after.formulas[newRow]?.[column] ?? "";
	// 行挿入で参照先が自動調整されても、計算結果と数式セル自体は保持される必要がある。
	return (
		(formula ? nextFormula !== "" : nextFormula === "") &&
		(before.formatted[oldRow]?.[column] ?? "") === (after.formatted[newRow]?.[column] ?? "") &&
		(before.raw[oldRow]?.[column] ?? "") === (after.raw[newRow]?.[column] ?? "")
	);
}

function insertionMatches(
	plan: SheetPlan,
	before: SheetSnapshot,
	after: SheetSnapshot,
	rowIndex: number,
	count: number,
): boolean {
	if (before.sheetId !== after.sheetId) return false;
	if (before.rowCount !== undefined && after.rowCount !== before.rowCount + count) return false;
	const offset = plan.config.range?.startRow ?? 1;
	const index = rowIndex - (offset - 1);
	if (index < 1) return false;
	const columns = width(plan, before, after);
	const rows = Math.max(rowLength(before), rowLength(after) - count);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			if (!sameCell(before, row, after, row >= index ? row + count : row, column))
				return false;
		}
	}
	for (let row = index; row < index + count; row++) {
		for (let column = 0; column < columns; column++) {
			if (after.formulas[row]?.[column]) continue;
			if (
				(after.formatted[row]?.[column] ?? "") !== "" ||
				(after.raw[row]?.[column] ?? "") !== ""
			)
				return false;
		}
	}
	// 容量情報も値の位置も変わらなければ、挿入済みだとは断定できない。
	return !snapshotsEqual(before, after);
}

function appendMatches(before: SheetSnapshot, after: SheetSnapshot, count: number): boolean {
	return (
		before.rowCount !== undefined &&
		after.rowCount === before.rowCount + count &&
		snapshotsEqual({ ...before, rowCount: after.rowCount }, after)
	);
}

function cellAddress(config: SheetConfig, row: number, column: number): string {
	let letters = "";
	for (let value = column; value > 0; value = Math.floor((value - 1) / 26)) {
		letters = String.fromCharCode(65 + ((value - 1) % 26)) + letters;
	}
	return `'${config.sheetName.replace(/'/g, "''")}'!${letters}${row}`;
}

function updatePosition(config: SheetConfig, range: string): { row: number; column: number } {
	const match = /!([A-Z]+)([1-9]\d*)$/.exec(range);
	if (!match) throw new Error(`単一セル以外の更新は適用できません: ${range}`);
	let column = 0;
	for (const letter of match[1]) column = column * 26 + letter.charCodeAt(0) - 64;
	const row = Number(match[2]);
	if (cellAddress(config, row, column) !== range)
		throw new Error(`更新先シートが一致しません: ${range}`);
	return {
		row: row - (config.range?.startRow ?? 1),
		column: column - (config.range?.startColumn ?? 1),
	};
}

function ordinaryData(
	plan: SheetPlan,
	snapshot: SheetSnapshot,
): { range: string; values: string[][] }[] {
	return plan.updates.filter((update) => {
		const { row, column } = updatePosition(plan.config, update.range);
		if (update.values.length !== 1 || update.values[0].length !== 1 || row < 0 || column < 0) {
			throw new Error(`不正なセル更新: ${update.range}`);
		}
		return !snapshot.formulas[row]?.[column];
	});
}

function assertFormulaResults(plan: SheetPlan, snapshot: SheetSnapshot): void {
	const mismatch = compareSheet(plan.config, plan.local, snapshot).find(
		(cell) => cell.kind === "protected-formula-mismatch",
	);
	if (mismatch) {
		throw new Error(
			`${plan.config.sheetName}: 保護数式の不一致 (${mismatch.row}:${mismatch.column})。書き込みを停止しました。Sheets上の数式と計算結果を確認・修正してから再実行してください。`,
		);
	}
}

function mutationMatches(
	plan: SheetPlan,
	before: SheetSnapshot,
	after: SheetSnapshot,
	pending: Extract<PendingMutation, { kind: "raw" }>,
): boolean {
	if (before.sheetId !== after.sheetId || before.rowCount !== after.rowCount) return false;
	const touched = new Map<string, string>();
	for (const update of pending.data) {
		const position = updatePosition(plan.config, update.range);
		touched.set(`${position.row}:${position.column}`, update.values[0][0]);
	}
	for (let row = 0; row < Math.max(rowLength(before), rowLength(after)); row++) {
		for (let column = 0; column < width(plan, before, after); column++) {
			const value = touched.get(`${row}:${column}`);
			if (value !== undefined) {
				const actual = after.raw[row]?.[column] ?? "";
				const numericCostumeCount =
					plan.config.sheetName === "フレンズデータ" &&
					plan.local[0]?.[column] === "特別衣装数" &&
					/^(0|[1-9]\d*)$/.test(value) &&
					typeof actual === "number" &&
					Number.isSafeInteger(actual) &&
					String(actual) === value &&
					after.formatted[row]?.[column] === value;
				if ((actual !== value && !numericCostumeCount) || after.formulas[row]?.[column])
					return false;
			} else if (before.formulas[row]?.[column]) {
				if (before.formulas[row][column] !== after.formulas[row]?.[column]) return false;
			} else if (!sameCell(before, row, after, row, column)) return false;
		}
	}
	return true;
}

function acknowledge(plan: SheetPlan, progress: SheetProgress, current: SheetSnapshot): void {
	const pending = progress.pending;
	if (!pending) {
		if (!snapshotsEqual(progress.checkpoint, current))
			throw new Error(
				`${plan.config.sheetName}: Sheetsが差分確認または前回の実行後に変更されています。Sheetsと保存済み実行記録を確認してから再実行してください。`,
			);
		return;
	}
	const matches =
		pending.kind === "insert"
			? insertionMatches(plan, progress.checkpoint, current, pending.rowIndex, pending.count)
			: pending.kind === "append"
				? appendMatches(progress.checkpoint, current, pending.count)
				: mutationMatches(plan, progress.checkpoint, current, pending);
	if (!matches) {
		throw new Error(
			`${plan.config.sheetName}: ${pending.kind}の実行結果を確定できません。自動再送しません。Sheetsと保存済み実行記録を照合してから再実行してください。`,
		);
	}
	if (pending.kind === "insert") progress.insertIndex++;
	if (pending.kind === "raw") progress.rawDone = true;
	progress.checkpoint = current;
	delete progress.pending;
}

export async function applySyncPlan(plan: SyncPlan, options: ApplyOptions): Promise<ApplyResult> {
	validateSyncPlan(plan);
	for (const sheet of plan.sheets) {
		const mismatch = sheet.comparisons.find(
			(cell) => cell.kind === "protected-formula-mismatch",
		);
		if (mismatch) {
			throw new Error(
				`${sheet.config.sheetName}: 保護数式の不一致 (${mismatch.row}:${mismatch.column})。Sheets上の数式と計算結果を確認・修正してから再実行してください。`,
			);
		}
	}
	const planHash = createHash("sha256").update(JSON.stringify(plan)).digest("hex");
	const resumed = existsSync(options.journalPath);
	const journal: ApplyJournal = resumed
		? (JSON.parse(readFileSync(options.journalPath, "utf8")) as ApplyJournal)
		: {
				version: 1,
				planHash,
				completed: false,
				sheets: plan.sheets.map((sheet) => ({
					checkpoint: normalizeSnapshot(sheet.base),
					insertIndex: 0,
					rawDone: false,
					complete: false,
				})),
			};
	if (
		journal.version !== 1 ||
		journal.planHash !== planHash ||
		journal.sheets.length !== plan.sheets.length
	) {
		throw new Error(
			"保存済み実行記録と今回の同期内容が一致しません。Sheetsと保存済み実行記録を確認してください。",
		);
	}
	// 一部のシートへ書く前に、全シートの編集元を検証する。
	for (const [index, sheet] of plan.sheets.entries()) {
		acknowledge(
			sheet,
			journal.sheets[index],
			normalizeSnapshot(await options.readSnapshot(sheet.config)),
		);
	}
	saveJournal(options.journalPath, journal);
	const comparisons: ApplyResult["comparisons"] = [];
	for (const [index, sheet] of plan.sheets.entries()) {
		const progress = journal.sheets[index];
		async function mutate(
			pending: PendingMutation,
			suffix: string,
			body: unknown,
		): Promise<void> {
			acknowledge(
				sheet,
				progress,
				normalizeSnapshot(await options.readSnapshot(sheet.config)),
			);
			progress.pending = pending;
			saveJournal(options.journalPath, journal);
			try {
				await options.request(suffix, body);
			} catch (error) {
				throw new Error(
					`${sheet.config.sheetName}: ${pending.kind}の通信が中断しました。再送せず停止しました。再実行すると保存済み実行記録とSheetsを照合します。`,
					{ cause: error },
				);
			}
			acknowledge(
				sheet,
				progress,
				normalizeSnapshot(await options.readSnapshot(sheet.config)),
			);
			saveJournal(options.journalPath, journal);
		}
		if (!progress.complete) {
			while (progress.insertIndex < sheet.inserts.length) {
				const { rowIndex, count } = sheet.inserts[progress.insertIndex];
				await mutate({ kind: "insert", rowIndex, count }, ":batchUpdate", {
					requests: [
						{
							insertDimension: {
								range: {
									sheetId: progress.checkpoint.sheetId,
									dimension: "ROWS",
									startIndex: rowIndex,
									endIndex: rowIndex + count,
								},
								inheritFromBefore: false,
							},
						},
					],
				});
			}
			const requiredRows = (sheet.config.range?.startRow ?? 1) - 1 + sheet.local.length;
			if (
				progress.checkpoint.rowCount !== undefined &&
				requiredRows > progress.checkpoint.rowCount
			) {
				const count = requiredRows - progress.checkpoint.rowCount;
				await mutate({ kind: "append", count }, ":batchUpdate", {
					requests: [
						{
							appendDimension: {
								sheetId: progress.checkpoint.sheetId,
								dimension: "ROWS",
								length: count,
							},
						},
					],
				});
			}
			assertFormulaResults(sheet, progress.checkpoint);
			if (!progress.rawDone) {
				const data = ordinaryData(sheet, progress.checkpoint);
				if (data.length)
					await mutate({ kind: "raw", data }, "/values:batchUpdate", {
						valueInputOption: "RAW",
						data,
					});
				else progress.rawDone = true;
			}
		}
		const current = normalizeSnapshot(await options.readSnapshot(sheet.config));
		if (!snapshotsEqual(progress.checkpoint, current))
			throw new Error(
				`${sheet.config.sheetName}: 書き込み後にSheetsが変更されています。Sheetsと保存済み実行記録を確認してから再実行してください。`,
			);
		const cells = compareSheet(sheet.config, sheet.local, current);
		comparisons.push({ sheetName: sheet.config.sheetName, comparisons: cells });
		const mismatches = cells.filter(
			(cell) => cell.kind === "different" || cell.kind === "protected-formula-mismatch",
		);
		if (mismatches.length)
			throw new Error(
				`${sheet.config.sheetName}: 読戻しで${mismatches.length}セルの実差分または保護数式の不一致が残っています。Sheets上の値と数式を確認・修正してから再実行してください。空セルの消去には--overwrite-emptyを明示してください。`,
			);
		progress.complete = true;
		progress.checkpoint = current;
		saveJournal(options.journalPath, journal);
	}
	journal.completed = true;
	saveJournal(options.journalPath, journal);
	return { completed: true, resumed, comparisons };
}
