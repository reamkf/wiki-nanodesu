import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applySyncPlan } from "../../../scripts/sheets-sync-apply";
import {
	createSheetPlan,
	type SheetSnapshot,
	type SyncPlan,
} from "../../../scripts/sheets-sync-plan";

const config = { sheetName: "イベントデータ", filePath: "events.csv" };
const headers = ["イベント名", "開催開始", "説明", "計算"];
const oldRow = ["既存", "2026/10/01 00:00", "既存リンク", ""];
const newRow = ["追加", "2026/11/01 00:00", "新リンク", ""];

function fixture(baseValues = [headers, oldRow], local = [headers, newRow, oldRow]) {
	const directory = mkdtempSync(join(tmpdir(), "sheets-apply-"));
	const journalPath = join(directory, "journal.json");
	const base: SheetSnapshot = {
		sheetId: 42,
		rowCount: 20,
		formatted: structuredClone(baseValues),
		raw: structuredClone(baseValues),
		formulas: baseValues.map((row) => row.map(() => "")),
	};
	const sheet = createSheetPlan(config, local, "csv-hash", base);
	const plan: SyncPlan = { version: 1, spreadsheetId: "test", sheets: [sheet] };
	let snapshot = structuredClone(base);
	const calls: { suffix: string; body: Record<string, unknown> }[] = [];
	let interruptInsert = false;
	let interruptBeforeInsert = false;
	let insertedFormula: { formula: string; value: number } | undefined;
	let corruptExistingAfterInsert = false;
	let corruptReadback = false;
	const readSnapshot = async () => structuredClone(snapshot);
	const request = async (suffix: string, value: unknown) => {
		const body = value as {
			requests?: {
				insertDimension?: { range: { startIndex: number; endIndex: number } };
				appendDimension?: { length: number };
			}[];
			valueInputOption?: string;
			data?: { range: string; values: string[][] }[];
		};
		calls.push({ suffix, body: body as Record<string, unknown> });
		for (const operation of body.requests ?? []) {
			if (operation.insertDimension) {
				if (interruptBeforeInsert) throw new Error("送信前の中断");
				const { startIndex, endIndex } = operation.insertDimension.range;
				const count = endIndex - startIndex;
				for (const rows of [snapshot.formatted, snapshot.raw, snapshot.formulas]) {
					rows.splice(startIndex, 0, ...Array.from({ length: count }, () => []));
				}
				snapshot.rowCount = (snapshot.rowCount ?? 0) + count;
				if (insertedFormula) {
					snapshot.formulas[startIndex] = ["", "", "", insertedFormula.formula];
					snapshot.raw[startIndex] = ["", "", "", insertedFormula.value];
					snapshot.formatted[startIndex] = ["", "", "", String(insertedFormula.value)];
				}
				if (corruptExistingAfterInsert) snapshot.raw[startIndex + count][2] = "混入";
				if (interruptInsert) {
					interruptInsert = false;
					throw new Error("挿入後に応答喪失");
				}
			}
			if (operation.appendDimension)
				snapshot.rowCount = (snapshot.rowCount ?? 0) + operation.appendDimension.length;
		}
		for (const update of body.data ?? []) {
			const match = /!([A-Z]+)(\d+)$/.exec(update.range)!;
			let column = 0;
			for (const letter of match[1]) column = column * 26 + letter.charCodeAt(0) - 64;
			column--;
			const row = Number(match[2]) - 1;
			for (const rows of [snapshot.formatted, snapshot.raw, snapshot.formulas]) {
				while (rows.length <= row) rows.push([]);
			}
			const input = update.values[0][0];
			snapshot.formulas[row][column] = "";
			snapshot.formatted[row][column] = corruptReadback ? "誤った値" : input;
			snapshot.raw[row][column] = corruptReadback ? "誤った値" : input;
		}
	};
	return {
		plan,
		sheet,
		base,
		calls,
		journalPath,
		options: { readSnapshot, request, journalPath },
		get snapshot() {
			return snapshot;
		},
		set snapshot(value: SheetSnapshot) {
			snapshot = value;
		},
		set interruptInsert(value: boolean) {
			interruptInsert = value;
		},
		set interruptBeforeInsert(value: boolean) {
			interruptBeforeInsert = value;
		},
		set insertedFormula(value: { formula: string; value: number }) {
			insertedFormula = value;
		},
		set corruptExistingAfterInsert(value: boolean) {
			corruptExistingAfterInsert = value;
		},
		set corruptReadback(value: boolean) {
			corruptReadback = value;
		},
		cleanup: () => rmSync(directory, { recursive: true, force: true }),
	};
}

describe("Sheets安全適用の状態遷移", () => {
	test("計画後にSheetsが変更されたら最初の書き込み前に停止する", async () => {
		const state = fixture();
		try {
			state.snapshot.raw[1][2] = "他者の変更";
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"変更されています",
			);
			expect(state.calls).toEqual([]);
		} finally {
			state.cleanup();
		}
	});

	test("挿入直後の通信中断を同じジャーナルで再開しても二重挿入しない", async () => {
		const state = fixture();
		try {
			state.interruptInsert = true;
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow("再送せず停止");
			const interrupted = JSON.parse(readFileSync(state.journalPath, "utf8"));
			expect(interrupted.sheets[0].pending.kind).toBe("insert");
			expect(state.snapshot.formatted[2]).toEqual(oldRow);
			const result = await applySyncPlan(state.plan, state.options);
			expect(result.completed).toBe(true);
			expect(result.resumed).toBe(true);
			expect(state.calls.filter((call) => call.suffix === ":batchUpdate")).toHaveLength(1);
			expect(state.snapshot.formatted.map((row) => row.slice(0, 3))).toEqual(
				[headers, newRow, oldRow].map((row) => row.slice(0, 3)),
			);
			expect(state.snapshot.formulas[1]?.[3] ?? "").toBe("");
		} finally {
			state.cleanup();
		}
	});

	test("挿入済みと確定できない中断は再開時にも自動再送しない", async () => {
		const state = fixture();
		try {
			state.interruptBeforeInsert = true;
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow("再送せず停止");
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"実行結果を確定できません",
			);
			expect(state.calls).toHaveLength(1);
		} finally {
			state.cleanup();
		}
	});

	test("挿入後の既存行保持を確認できなければセルを書き込まない", async () => {
		const state = fixture();
		try {
			state.corruptExistingAfterInsert = true;
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"実行結果を確定できません",
			);
			expect(state.calls).toHaveLength(1);
		} finally {
			state.cleanup();
		}
	});

	test("自動補完された新行の数式結果がCSVと異なればRAW更新前に停止する", async () => {
		const state = fixture([headers, oldRow], [headers, [...newRow.slice(0, 3), "3"], oldRow]);
		try {
			state.insertedFormula = { formula: "=1+1", value: 2 };
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"保護数式の不一致",
			);
			expect(state.calls.map((call) => call.suffix)).toEqual([":batchUpdate"]);
		} finally {
			state.cleanup();
		}
	});

	test("CSVと一致する新行の自動補完数式をRAW更新で上書きしない", async () => {
		const state = fixture([headers, oldRow], [headers, [...newRow.slice(0, 3), "3"], oldRow]);
		try {
			state.insertedFormula = { formula: "=1+2", value: 3 };
			const result = await applySyncPlan(state.plan, state.options);
			expect(result.completed).toBe(true);
			expect(state.snapshot.formulas[1][3]).toBe("=1+2");
			const valuesCalls = state.calls.filter((call) => call.suffix === "/values:batchUpdate");
			expect(valuesCalls.map((call) => call.body.valueInputOption)).toEqual(["RAW"]);
			expect(JSON.stringify(valuesCalls[0].body)).not.toContain("D2");
		} finally {
			state.cleanup();
		}
	});

	test("新行の数式不一致で停止した実行を再開しても挿入やRAW更新を繰り返さない", async () => {
		const state = fixture([headers, oldRow], [headers, [...newRow.slice(0, 3), "3"], oldRow]);
		try {
			state.insertedFormula = { formula: "=1+1", value: 2 };
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"保護数式の不一致",
			);
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"保護数式の不一致",
			);
			expect(state.calls.map((call) => call.suffix)).toEqual([":batchUpdate"]);
			expect(state.snapshot.formulas[1][3]).toBe("=1+1");
		} finally {
			state.cleanup();
		}
	});

	test("RAW反映直後の中断を再開してもセル更新を二重送信せず数式を保持する", async () => {
		const state = fixture([headers, oldRow], [headers, [...newRow.slice(0, 3), "3"], oldRow]);
		try {
			state.insertedFormula = { formula: "=1+2", value: 3 };
			const options = {
				...state.options,
				request: async (suffix: string, body: unknown) => {
					await state.options.request(suffix, body);
					if (suffix === "/values:batchUpdate") throw new Error("反映後に応答喪失");
				},
			};
			await expect(applySyncPlan(state.plan, options)).rejects.toThrow("再送せず停止");
			const journal = JSON.parse(readFileSync(state.journalPath, "utf8"));
			expect(journal.sheets[0].pending.kind).toBe("raw");
			const result = await applySyncPlan(state.plan, state.options);
			expect(result.resumed).toBe(true);
			expect(result.completed).toBe(true);
			expect(state.calls.map((call) => call.suffix)).toEqual([
				":batchUpdate",
				"/values:batchUpdate",
			]);
			expect(state.snapshot.formulas[1][3]).toBe("=1+2");
		} finally {
			state.cleanup();
		}
	});

	test("既存の一致する数式を保持したまま通常セルだけRAW更新する", async () => {
		const baseValues = [headers, [...oldRow.slice(0, 3), "3"]];
		const local = [headers, [oldRow[0], oldRow[1], "更新リンク", "3"]];
		const state = fixture(baseValues, local);
		try {
			state.base.formulas[1][3] = "=1+2";
			state.base.raw[1][3] = 3;
			state.plan.sheets[0] = createSheetPlan(config, local, "csv-hash", state.base);
			state.snapshot = structuredClone(state.base);
			await applySyncPlan(state.plan, state.options);
			expect(state.snapshot.formulas[1][3]).toBe("=1+2");
			expect(state.snapshot.formatted[1][2]).toBe("更新リンク");
			expect(state.calls).toHaveLength(1);
			expect(state.calls[0].body.valueInputOption).toBe("RAW");
			expect(JSON.stringify(state.calls[0].body)).not.toContain("D2");
		} finally {
			state.cleanup();
		}
	});

	test("RAW更新時に保護数式自体が変われば実行結果を確定しない", async () => {
		const baseValues = [headers, [...oldRow.slice(0, 3), "3"]];
		const local = [headers, [oldRow[0], oldRow[1], "更新リンク", "3"]];
		const state = fixture(baseValues, local);
		try {
			state.base.formulas[1][3] = "=1+2";
			state.base.raw[1][3] = 3;
			state.plan.sheets[0] = createSheetPlan(config, local, "csv-hash", state.base);
			state.snapshot = structuredClone(state.base);
			const options = {
				...state.options,
				request: async (suffix: string, body: unknown) => {
					await state.options.request(suffix, body);
					state.snapshot.formulas[1][3] = "=2+1";
				},
			};
			await expect(applySyncPlan(state.plan, options)).rejects.toThrow(
				"実行結果を確定できません",
			);
			const journal = JSON.parse(readFileSync(state.journalPath, "utf8"));
			expect(journal.sheets[0].pending.kind).toBe("raw");
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"実行結果を確定できません",
			);
			expect(state.calls).toHaveLength(1);
		} finally {
			state.cleanup();
		}
	});

	test("完了した計画の再適用は読戻しのみで挿入もセル更新もしない", async () => {
		const state = fixture();
		try {
			await applySyncPlan(state.plan, state.options);
			const calls = state.calls.length;
			await applySyncPlan(state.plan, state.options);
			expect(state.calls).toHaveLength(calls);
			const journal = JSON.parse(readFileSync(state.journalPath, "utf8"));
			expect(journal.completed).toBe(true);
		} finally {
			state.cleanup();
		}
	});

	test("完了後のSheets改変も読み直して検出する", async () => {
		const state = fixture();
		try {
			await applySyncPlan(state.plan, state.options);
			state.snapshot.formatted[2][2] = "外部変更";
			const calls = state.calls.length;
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"変更されています",
			);
			expect(state.calls).toHaveLength(calls);
		} finally {
			state.cleanup();
		}
	});

	test("末尾追加は容量が足りるなら構造変更をしない", async () => {
		const state = fixture([headers, oldRow], [headers, oldRow, newRow]);
		try {
			await applySyncPlan(state.plan, state.options);
			expect(state.calls.every((call) => call.suffix === "/values:batchUpdate")).toBe(true);
			expect(state.snapshot.formatted.map((row) => row.slice(0, 3))).toEqual(
				[headers, oldRow, newRow].map((row) => row.slice(0, 3)),
			);
			expect(state.snapshot.formulas[2]?.[3] ?? "").toBe("");
		} finally {
			state.cleanup();
		}
	});

	test("末尾追加で不足するグリッド容量だけappendDimensionする", async () => {
		const state = fixture([headers, oldRow], [headers, oldRow, newRow]);
		try {
			state.sheet.base.rowCount = 2;
			state.snapshot.rowCount = 2;
			await applySyncPlan(state.plan, state.options);
			expect(state.calls[0]).toEqual({
				suffix: ":batchUpdate",
				body: {
					requests: [{ appendDimension: { sheetId: 42, dimension: "ROWS", length: 1 } }],
				},
			});
			expect(state.calls.filter((call) => call.suffix === ":batchUpdate")).toHaveLength(1);
		} finally {
			state.cleanup();
		}
	});

	test("書き込みの読戻し不一致を成功扱いしない", async () => {
		const state = fixture();
		try {
			state.corruptReadback = true;
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"実行結果を確定できません",
			);
			const journal = JSON.parse(readFileSync(state.journalPath, "utf8"));
			expect(journal.completed).toBe(false);
		} finally {
			state.cleanup();
		}
	});

	test("スキップされた空セルが残る場合は一致と報告しない", async () => {
		const state = fixture([headers, oldRow], [headers, [oldRow[0], oldRow[1], "", ""]]);
		try {
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow("実差分");
			expect(state.calls).toEqual([]);
		} finally {
			state.cleanup();
		}
	});

	test("後続シートに既存数式の不一致がある場合も全体の書き込み前に停止する", async () => {
		const state = fixture();
		try {
			const photoConfig = { sheetName: "フォトデータ", filePath: "photos.csv" };
			const photoBase: SheetSnapshot = {
				sheetId: 43,
				rowCount: 20,
				formatted: [
					["フォト名", "結果"],
					["既存フォト", "2"],
				],
				raw: [
					["フォト名", "結果"],
					["既存フォト", 2],
				],
				formulas: [[], ["", "=1+1"]],
			};
			state.plan.sheets.push(
				createSheetPlan(
					photoConfig,
					[
						["フォト名", "結果"],
						["既存フォト", "3"],
					],
					"photo-hash",
					photoBase,
				),
			);
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"保護数式の不一致",
			);
			expect(state.calls).toEqual([]);
		} finally {
			state.cleanup();
		}
	});

	test("明示した空セル削除だけRAWで反映して一致を確認する", async () => {
		const local = [headers, [oldRow[0], oldRow[1], "", ""]];
		const state = fixture([headers, oldRow], local);
		try {
			state.plan.sheets[0] = createSheetPlan(config, local, "csv-hash", state.base, true);
			const result = await applySyncPlan(state.plan, state.options);
			expect(result.completed).toBe(true);
			expect(state.snapshot.raw[1][2]).toBe("");
			expect(state.calls).toHaveLength(1);
			expect(state.calls[0].body.valueInputOption).toBe("RAW");
		} finally {
			state.cleanup();
		}
	});

	test("別計画のジャーナルを流用して適用しない", async () => {
		const state = fixture();
		try {
			await applySyncPlan(state.plan, state.options);
			state.sheet.csvHash = "changed-csv-hash";
			const calls = state.calls.length;
			await expect(applySyncPlan(state.plan, state.options)).rejects.toThrow(
				"保存済み実行記録と今回の同期内容が一致しません",
			);
			expect(state.calls).toHaveLength(calls);
		} finally {
			state.cleanup();
		}
	});
});
