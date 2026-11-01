import type { SheetConfig } from "./fetch-csv-from-sheets";

export interface SheetSnapshot {
	sheetId: number;
	rowCount?: number;
	formatted: string[][];
	raw: (string | number | boolean)[][];
	formulas: string[][];
}

export interface CellComparison {
	row: number;
	column: number;
	local: string;
	remote: string;
	kind: "exact" | "display-only" | "different" | "protected-formula-mismatch";
	formula?: string;
}

export interface SheetPlan {
	config: SheetConfig;
	csvHash: string;
	local: string[][];
	base: SheetSnapshot;
	overwriteEmpty: boolean;
	inserts: { rowIndex: number; count: number }[];
	updates: { range: string; values: string[][] }[];
	comparisons: CellComparison[];
}

export interface SyncPlan {
	version: 1;
	spreadsheetId: string;
	sheets: SheetPlan[];
}

const KEY_HEADERS: Record<string, readonly string[]> = {
	フレンズデータ: ["ID"],
	フォトデータ: ["フォト名"],
	イベントデータ: ["イベント名", "開催開始"],
};

const PERCENT_HEADERS: Record<string, true> = {
	Beat補正: true,
	Action補正: true,
	Try補正: true,
	Beat補正野生5: true,
	Action補正野生5: true,
	Try補正野生5: true,
	かいひ: true,
	かいひ野生5: true,
};

function rowHasValue(row: readonly (string | number | boolean)[] | undefined): boolean {
	return row?.some((value) => value !== "") ?? false;
}

function snapshotHeight(snapshot: SheetSnapshot): number {
	return Math.max(snapshot.formatted.length, snapshot.raw.length, snapshot.formulas.length);
}

function trimRow<T extends string | number | boolean>(row: readonly T[]): T[] {
	let end = row.length;
	while (end > 0 && row[end - 1] === "") end--;
	return row.slice(0, end);
}

// APIが省略する末尾空セル・空行だけを揃え、文字列と内部値の型は維持する。
export function normalizeSnapshot(snapshot: SheetSnapshot): SheetSnapshot {
	let height = snapshotHeight(snapshot);
	while (
		height > 0 &&
		!rowHasValue(snapshot.formatted[height - 1]) &&
		!rowHasValue(snapshot.raw[height - 1]) &&
		!rowHasValue(snapshot.formulas[height - 1])
	)
		height--;
	const normalized: SheetSnapshot = {
		sheetId: snapshot.sheetId,
		formatted: Array.from({ length: height }, (_, row) =>
			trimRow(snapshot.formatted[row] ?? []),
		),
		raw: Array.from({ length: height }, (_, row) => trimRow(snapshot.raw[row] ?? [])),
		formulas: Array.from({ length: height }, (_, row) => trimRow(snapshot.formulas[row] ?? [])),
	};
	if (snapshot.rowCount !== undefined) normalized.rowCount = snapshot.rowCount;
	return normalized;
}

export function snapshotsEqual(left: SheetSnapshot, right: SheetSnapshot): boolean {
	return JSON.stringify(normalizeSnapshot(left)) === JSON.stringify(normalizeSnapshot(right));
}

function widthOf(config: SheetConfig, local: string[][], snapshot: SheetSnapshot): number {
	if (config.range?.endColumn !== undefined)
		return config.range.endColumn - (config.range.startColumn ?? 1) + 1;
	return Math.max(
		0,
		...local.map((row) => row.length),
		...snapshot.formatted.map((row) => row.length),
		...snapshot.raw.map((row) => row.length),
		...snapshot.formulas.map((row) => row.length),
	);
}

function percentValue(value: string): number | undefined {
	if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)%$/.test(value)) return undefined;
	const number = Number(value.slice(0, -1)) / 100;
	return Number.isFinite(number) ? number : undefined;
}

function percentEqual(local: string, remote: string, raw: string | number | boolean): boolean {
	const expected = percentValue(local);
	if (expected === undefined) return false;
	const actual = typeof raw === "number" ? raw : percentValue(remote);
	return (
		actual !== undefined &&
		Math.abs(expected - actual) <=
			Number.EPSILON * Math.max(1, Math.abs(expected), Math.abs(actual)) * 4
	);
}

// 空セルも数式の計算結果も比較し、更新を省略したことを一致とは扱わない。
export function compareSheet(
	config: SheetConfig,
	local: string[][],
	snapshot: SheetSnapshot,
): CellComparison[] {
	const comparisons: CellComparison[] = [];
	const width = widthOf(config, local, snapshot);
	const height = Math.max(local.length, snapshotHeight(snapshot));
	for (let row = 0; row < height; row++) {
		for (let column = 0; column < width; column++) {
			const expected = local[row]?.[column] ?? "";
			const actual = snapshot.formatted[row]?.[column] ?? "";
			const formula = snapshot.formulas[row]?.[column] ?? "";
			let kind: CellComparison["kind"] = expected === actual ? "exact" : "different";
			if (
				kind === "different" &&
				row > 0 &&
				config.sheetName === "フレンズデータ" &&
				Object.hasOwn(PERCENT_HEADERS, local[0]?.[column] ?? "") &&
				percentEqual(expected, actual, snapshot.raw[row]?.[column] ?? "")
			)
				kind = "display-only";
			if (kind === "different" && formula) kind = "protected-formula-mismatch";
			comparisons.push({
				row: row + (config.range?.startRow ?? 1),
				column: column + (config.range?.startColumn ?? 1),
				local: expected,
				remote: actual,
				kind,
				...(formula ? { formula } : {}),
			});
		}
	}
	return comparisons;
}

function cellAddress(config: SheetConfig, row: number, column: number): string {
	let letters = "";
	for (let remaining = column; remaining > 0; remaining = Math.floor((remaining - 1) / 26))
		letters = String.fromCharCode(65 + ((remaining - 1) % 26)) + letters;
	return `'${config.sheetName.replace(/'/g, "''")}'!${letters}${row}`;
}

function alignment(
	config: SheetConfig,
	local: string[][],
	base: SheetSnapshot,
): {
	rows: (number | undefined)[];
	inserts: SheetPlan["inserts"];
} {
	const keyHeaders = Object.hasOwn(KEY_HEADERS, config.sheetName)
		? KEY_HEADERS[config.sheetName]
		: undefined;
	if (!keyHeaders) {
		if (local.length !== snapshotHeight(base))
			throw new Error(
				`${config.sheetName}: 識別キー未設定のシートでは行数を変更できません。`,
			);
		return { rows: local.map((_, row) => row), inserts: [] };
	}
	const headers = local[0];
	if (!headers || new Set(headers).size !== headers.length)
		throw new Error(`${config.sheetName}: ヘッダーが空または重複しています。`);
	const columns = keyHeaders.map((name) => {
		const column = headers.indexOf(name);
		if (column < 0) throw new Error(`${config.sheetName}: 識別キー列がありません: ${name}`);
		return column;
	});
	if (
		base.formatted.length > 0 &&
		headers.some((header, column) => header !== (base.formatted[0]?.[column] ?? ""))
	)
		throw new Error(`${config.sheetName}: SheetsのヘッダーがCSVと一致しません。`);
	function keys(rows: string[][], label: string): string[] {
		const seen = new Set<string>();
		return rows.slice(1).map((row) => {
			const values = columns.map((column) => row[column] ?? "");
			if (values.some((value) => value === ""))
				throw new Error(`${config.sheetName}: ${label}の識別キーが空です。`);
			const key = JSON.stringify(values);
			if (seen.has(key))
				throw new Error(`${config.sheetName}: ${label}の識別キーが重複しています: ${key}`);
			seen.add(key);
			return key;
		});
	}
	const localKeys = keys(local, "CSV");
	const remoteKeys = keys(base.formatted, "Sheets");
	const localPositions = new Map(localKeys.map((key, index) => [key, index]));
	let previous = -1;
	for (const key of remoteKeys) {
		const position = localPositions.get(key);
		if (position === undefined)
			throw new Error(`${config.sheetName}: 既存行の削除は計画できません: ${key}`);
		if (position <= previous)
			throw new Error(`${config.sheetName}: 既存行の並べ替えは計画できません。`);
		previous = position;
	}
	const rows: (number | undefined)[] = [base.formatted.length > 0 ? 0 : undefined];
	const inserts: SheetPlan["inserts"] = [];
	let remoteIndex = 0;
	for (let index = 0; index < localKeys.length; index++) {
		if (localKeys[index] === remoteKeys[remoteIndex]) {
			rows.push(++remoteIndex);
		} else {
			rows.push(undefined);
			// 末尾追加では既存行を移動する必要がない。
			if (remoteIndex < remoteKeys.length) {
				const rowIndex = (config.range?.startRow ?? 1) + index;
				const last = inserts[inserts.length - 1];
				if (last && last.rowIndex + last.count === rowIndex) last.count++;
				else inserts.push({ rowIndex, count: 1 });
			}
		}
	}
	return { rows, inserts };
}

function validateConfig(config: SheetConfig): void {
	if (
		!config ||
		typeof config !== "object" ||
		typeof config.sheetName !== "string" ||
		!config.sheetName ||
		typeof config.filePath !== "string" ||
		!config.filePath
	)
		throw new Error("シート設定が不正です。");
	if (config.range !== undefined) {
		if (!config.range || typeof config.range !== "object")
			throw new Error("シート範囲が不正です。");
		for (const value of Object.values(config.range))
			if (!Number.isSafeInteger(value) || value < 1)
				throw new Error("シート範囲が不正です。");
		if (
			(config.range.endRow ?? Infinity) < (config.range.startRow ?? 1) ||
			(config.range.endColumn ?? Infinity) < (config.range.startColumn ?? 1)
		)
			throw new Error("シート範囲が不正です。");
	}
}

function isMatrix(value: unknown, cell: (value: unknown) => boolean): boolean {
	return Array.isArray(value) && value.every((row) => Array.isArray(row) && row.every(cell));
}

export function validateSnapshot(snapshot: unknown): asserts snapshot is SheetSnapshot {
	if (!snapshot || typeof snapshot !== "object") throw new Error("スナップショットが不正です。");
	const value = snapshot as SheetSnapshot;
	if (
		!Number.isSafeInteger(value.sheetId) ||
		value.sheetId < 0 ||
		(value.rowCount !== undefined &&
			(!Number.isSafeInteger(value.rowCount) || value.rowCount < 1)) ||
		!isMatrix(value.formatted, (cell) => typeof cell === "string") ||
		!isMatrix(
			value.raw,
			(cell) =>
				typeof cell === "string" ||
				typeof cell === "boolean" ||
				(typeof cell === "number" && Number.isFinite(cell)),
		) ||
		!isMatrix(
			value.formulas,
			(cell) => typeof cell === "string" && (cell === "" || cell.startsWith("=")),
		)
	)
		throw new Error("スナップショットが不正です。");
}

export function createSheetPlan(
	config: SheetConfig,
	local: string[][],
	csvHash: string,
	snapshot: SheetSnapshot,
	overwriteEmpty = false,
): SheetPlan {
	validateConfig(config);
	validateSnapshot(snapshot);
	if (
		!isMatrix(local, (cell) => typeof cell === "string") ||
		!local[0]?.length ||
		local.some((row) => row.length !== local[0].length) ||
		typeof csvHash !== "string" ||
		!csvHash ||
		typeof overwriteEmpty !== "boolean"
	)
		throw new Error("CSVまたは同期設定が不正です。");
	const base = normalizeSnapshot(snapshot);
	const width = widthOf(config, local, base);
	if (
		local[0].length !== width ||
		[base.formatted, base.raw, base.formulas].some((matrix) =>
			matrix.some((row) => row.length > width),
		)
	)
		throw new Error(`${config.sheetName}: 設定範囲と列数が一致しません。`);
	if (
		config.range?.endRow !== undefined &&
		Math.max(local.length, snapshotHeight(base)) >
			config.range.endRow - (config.range.startRow ?? 1) + 1
	)
		throw new Error(`${config.sheetName}: 設定範囲を超える行があります。`);
	const { rows, inserts } = alignment(config, local, base);
	const aligned: SheetSnapshot = {
		sheetId: base.sheetId,
		formatted: rows.map((row) => (row === undefined ? [] : (base.formatted[row] ?? []))),
		raw: rows.map((row) => (row === undefined ? [] : (base.raw[row] ?? []))),
		formulas: rows.map((row) => (row === undefined ? [] : (base.formulas[row] ?? []))),
	};
	const comparisons = compareSheet(config, local, aligned);
	return {
		config: { ...config, ...(config.range ? { range: { ...config.range } } : {}) },
		csvHash,
		local: local.map((row) => [...row]),
		base,
		overwriteEmpty,
		inserts,
		updates: comparisons
			.filter((cell) => cell.kind === "different" && (overwriteEmpty || cell.local !== ""))
			.map((cell) => ({
				range: cellAddress(config, cell.row, cell.column),
				values: [[cell.local]],
			})),
		comparisons,
	};
}

// 保存した実行内容を再検証し、数式や対象範囲を保護する。
export function validateSyncPlan(plan: unknown): asserts plan is SyncPlan {
	if (!plan || typeof plan !== "object") throw new Error("同期計画が不正です。");
	const candidate = plan as SyncPlan;
	if (
		candidate.version !== 1 ||
		typeof candidate.spreadsheetId !== "string" ||
		!candidate.spreadsheetId ||
		!Array.isArray(candidate.sheets) ||
		candidate.sheets.length === 0
	)
		throw new Error("同期計画のバージョンまたは対象が不正です。");
	const names = new Set<string>();
	const ids = new Set<number>();
	for (const sheet of candidate.sheets) {
		if (!sheet || typeof sheet !== "object" || typeof sheet.overwriteEmpty !== "boolean")
			throw new Error("シート計画が不正です。");
		const regenerated = createSheetPlan(
			sheet.config,
			sheet.local,
			sheet.csvHash,
			sheet.base,
			sheet.overwriteEmpty,
		);
		if (names.has(sheet.config.sheetName) || ids.has(sheet.base.sheetId))
			throw new Error("同期計画の対象シートが重複しています。");
		names.add(sheet.config.sheetName);
		ids.add(sheet.base.sheetId);
		for (const name of ["inserts", "updates", "comparisons"] as const)
			if (JSON.stringify(sheet[name]) !== JSON.stringify(regenerated[name]))
				throw new Error(`同期計画の${name}が元データと一致しません。`);
	}
}
