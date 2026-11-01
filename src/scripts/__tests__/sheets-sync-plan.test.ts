import { describe, expect, test } from "bun:test";
import { parseCsv } from "../../../scripts/csv-rows";
import type { SheetConfig } from "../../../scripts/fetch-csv-from-sheets";
import {
	compareSheet,
	createSheetPlan,
	normalizeSnapshot,
	snapshotsEqual,
	validateSnapshot,
	validateSyncPlan,
	type SheetPlan,
	type SheetSnapshot,
	type SyncPlan,
} from "../../../scripts/sheets-sync-plan";

const eventConfig: SheetConfig = { sheetName: "イベントデータ", filePath: "events.csv" };
const friendsConfig: SheetConfig = { sheetName: "フレンズデータ", filePath: "friends.csv" };
const headers = ["イベント名", "開催開始", "リンク", "実装対象"];
const oldA = ["イベントA", "2026/10/01", "https://a.example", "フレンズA"];
const oldB = ["イベントB", "2026/10/08", "https://b.example", "フレンズB"];
const added = ["新イベント", "2026/11/01", "https://new.example", "新フレンズ"];

function snapshot(formatted: string[][], formulas: string[][] = []): SheetSnapshot {
	return { sheetId: 42, formatted, raw: formatted.map((row) => [...row]), formulas };
}

function envelope(sheet: SheetPlan): SyncPlan {
	return { version: 1, spreadsheetId: "test-spreadsheet", sheets: [sheet] };
}

describe("Sheets同期計画のキー対応", () => {
	test("ヘッダー直後の追加では既存リンクと実装対象を新行へ混ぜない", () => {
		const base = snapshot([headers, oldA, oldB]);
		const plan = createSheetPlan(eventConfig, [headers, added, oldA, oldB], "hash", base);
		expect(plan.inserts).toEqual([{ rowIndex: 1, count: 1 }]);
		expect(plan.updates).toEqual(
			added.map((value, index) => ({
				range: `'イベントデータ'!${String.fromCharCode(65 + index)}2`,
				values: [[value]],
			})),
		);
		expect(
			plan.comparisons.filter((cell) => cell.row >= 3).every((cell) => cell.kind === "exact"),
		).toBe(true);
		expect(base.formatted).toEqual([headers, oldA, oldB]);
	});

	test("途中の連続追加を一つの挿入ブロックにする", () => {
		const second = ["追加2", "2026/11/02", "リンク2", "対象2"];
		const plan = createSheetPlan(
			eventConfig,
			[headers, oldA, added, second, oldB],
			"hash",
			snapshot([headers, oldA, oldB]),
		);
		expect(plan.inserts).toEqual([{ rowIndex: 2, count: 2 }]);
		expect(plan.updates).toHaveLength(8);
		expect(plan.updates.every((update) => /[34]$/.test(update.range))).toBe(true);
	});

	test("離れた挿入ブロックは先行挿入後の絶対位置を持つ", () => {
		const second = ["追加2", "2026/11/02", "リンク2", "対象2"];
		const plan = createSheetPlan(
			eventConfig,
			[headers, added, oldA, second, oldB],
			"hash",
			snapshot([headers, oldA, oldB]),
		);
		expect(plan.inserts).toEqual([
			{ rowIndex: 1, count: 1 },
			{ rowIndex: 3, count: 1 },
		]);
	});

	test("末尾追加では行挿入を計画しない", () => {
		const plan = createSheetPlan(
			eventConfig,
			[headers, oldA, added],
			"hash",
			snapshot([headers, oldA]),
		);
		expect(plan.inserts).toEqual([]);
		expect(plan.updates).toHaveLength(4);
		expect(plan.updates.every((update) => update.range.endsWith("3"))).toBe(true);
	});

	test("イベント名が同じでも開催開始が違えば別レコードになる", () => {
		const repeated = [...oldA];
		repeated[1] = "2026/11/01";
		expect(
			createSheetPlan(
				eventConfig,
				[headers, repeated, oldA],
				"hash",
				snapshot([headers, oldA]),
			).inserts,
		).toEqual([{ rowIndex: 1, count: 1 }]);
	});

	test("既存行の削除と並べ替えを拒否する", () => {
		const base = snapshot([headers, oldA, oldB]);
		expect(() => createSheetPlan(eventConfig, [headers, oldB], "hash", base)).toThrow("削除");
		expect(() => createSheetPlan(eventConfig, [headers, oldB, oldA], "hash", base)).toThrow(
			"並べ替え",
		);
	});

	test("ローカルとSheets双方の重複キー、空キーを拒否する", () => {
		expect(() =>
			createSheetPlan(eventConfig, [headers, oldA, oldA], "hash", snapshot([headers, oldA])),
		).toThrow("重複");
		expect(() =>
			createSheetPlan(eventConfig, [headers, oldA], "hash", snapshot([headers, oldA, oldA])),
		).toThrow("重複");
		expect(() =>
			createSheetPlan(
				eventConfig,
				[headers, ["", "2026/11/01", "", ""]],
				"hash",
				snapshot([headers]),
			),
		).toThrow("空");
	});

	test("IDとフォト名は文字列のまま識別する", () => {
		const friends = parseCsv("ID,説明\n001,既存\n1,新規");
		expect(
			createSheetPlan(friendsConfig, friends, "hash", snapshot(friends.slice(0, 2))).inserts,
		).toEqual([]);
		const photoConfig = { sheetName: "フォトデータ", filePath: "photos.csv" };
		expect(
			createSheetPlan(
				photoConfig,
				[["フォト名"], ["新フォト"], ["既存フォト"]],
				"hash",
				snapshot([["フォト名"], ["既存フォト"]]),
			).inserts,
		).toEqual([{ rowIndex: 1, count: 1 }]);
	});

	test("識別キーのないシートは通常の更新だけを許可する", () => {
		const config = { sheetName: "その他", filePath: "other.csv" };
		expect(
			createSheetPlan(config, [["列"], ["更新"]], "hash", snapshot([["列"], ["以前"]]))
				.updates,
		).toEqual([{ range: "'その他'!A2", values: [["更新"]] }]);
		expect(() =>
			createSheetPlan(
				config,
				[["列"], ["以前"], ["追加"]],
				"hash",
				snapshot([["列"], ["以前"]]),
			),
		).toThrow("識別キー未設定");
		expect(() =>
			createSheetPlan(config, [["列"]], "hash", snapshot([["列"], ["以前"]])),
		).toThrow("識別キー未設定");
	});

	test("ヘッダー変更やキー列欠落は停止する", () => {
		expect(() =>
			createSheetPlan(
				eventConfig,
				[headers, oldA],
				"hash",
				snapshot([["別名", ...headers.slice(1)], oldA]),
			),
		).toThrow("ヘッダー");
		expect(() =>
			createSheetPlan(
				eventConfig,
				[["イベント名"], ["名前"]],
				"hash",
				snapshot([["イベント名"]]),
			),
		).toThrow("開催開始");
	});
});

describe("空セル、数式と表示差の比較", () => {
	test("空セルの差分は常に診断するが消去は明示指定時だけ計画する", () => {
		const local = [
			["ID", "説明"],
			["a", ""],
		];
		const base = snapshot([
			["ID", "説明"],
			["a", "残す"],
		]);
		const plan = createSheetPlan(friendsConfig, local, "hash", base);
		expect(plan.updates).toEqual([]);
		expect(plan.comparisons.find((cell) => cell.row === 2 && cell.column === 2)).toMatchObject({
			kind: "different",
			local: "",
			remote: "残す",
		});
		expect(createSheetPlan(friendsConfig, local, "hash", base, true).updates).toEqual([
			{ range: "'フレンズデータ'!B2", values: [[""]] },
		]);
	});

	test("数式の計算結果が異なる場合も空セルの場合も成功扱いしない", () => {
		const base = snapshot(
			[
				["ID", "説明"],
				["a", "計算結果"],
			],
			[[], ["", "=A2"]],
		);
		for (const value of ["期待値", ""]) {
			const plan = createSheetPlan(
				friendsConfig,
				[
					["ID", "説明"],
					["a", value],
				],
				"hash",
				base,
				true,
			);
			expect(plan.updates).toEqual([]);
			expect(
				plan.comparisons.find((cell) => cell.row === 2 && cell.column === 2),
			).toMatchObject({ kind: "protected-formula-mismatch", formula: "=A2" });
		}
		expect(
			compareSheet(friendsConfig, base.formatted, base).every(
				(cell) => cell.kind === "exact",
			),
		).toBe(true);
	});

	test("挿入で移動した既存数式は新規行の数式と混同しない", () => {
		const base = snapshot([headers, oldA], [[], ["", "", "=A2", ""]]);
		const changedA = [...oldA];
		changedA[2] = "別結果";
		const plan = createSheetPlan(eventConfig, [headers, added, changedA], "hash", base, true);
		expect(plan.updates.some((update) => update.range === "'イベントデータ'!C3")).toBe(false);
		expect(plan.comparisons.find((cell) => cell.row === 3 && cell.column === 3)?.kind).toBe(
			"protected-formula-mismatch",
		);
		expect(
			plan.updates.find((update) => update.range === "'イベントデータ'!C2")?.values,
		).toEqual([[added[2]]]);
	});

	test("実在する補正と回避の8列だけが百分率の表示差を許可する", () => {
		const allowed = [
			"Beat補正",
			"Action補正",
			"Try補正",
			"Beat補正野生5",
			"Action補正野生5",
			"Try補正野生5",
			"かいひ",
			"かいひ野生5",
		];
		for (const header of allowed) {
			const local = [
				["ID", header],
				["a", "5.0%"],
			];
			const base = snapshot([
				["ID", header],
				["a", "5%"],
			]);
			base.raw[1][1] = 0.05;
			const plan = createSheetPlan(friendsConfig, local, "hash", base);
			expect(plan.updates).toEqual([]);
			expect(plan.comparisons.find((cell) => cell.row === 2 && cell.column === 2)?.kind).toBe(
				"display-only",
			);
		}
	});

	test("数値列でも内部値が違えば実差分になる", () => {
		const base = snapshot([
			["ID", "Beat補正"],
			["a", "5%"],
		]);
		base.raw[1][1] = 0.06;
		expect(
			createSheetPlan(
				friendsConfig,
				[
					["ID", "Beat補正"],
					["a", "5.0%"],
				],
				"hash",
				base,
			).updates,
		).toEqual([{ range: "'フレンズデータ'!B2", values: [["5.0%"]] }]);
	});

	test("本文と他シートは百分率文字列を数値化しない", () => {
		for (const [config, header] of [
			[friendsConfig, "本文"],
			[{ sheetName: "その他", filePath: "other.csv" }, "Beat補正"],
		] as const) {
			const plan = createSheetPlan(
				config,
				[
					["ID", header],
					["a", "5.0%"],
				],
				"hash",
				snapshot([
					["ID", header],
					["a", "5%"],
				]),
			);
			expect(plan.updates).toHaveLength(1);
		}
		const plan = createSheetPlan(
			friendsConfig,
			[
				["ID", "説明"],
				["001", "Ａ"],
			],
			"hash",
			snapshot([
				["ID", "説明"],
				["001", "A"],
			]),
		);
		expect(plan.updates[0].values).toEqual([["Ａ"]]);
	});

	test("A1位置は開始行・列、複数文字列、引用符を保持する", () => {
		const config = {
			sheetName: "シート'名",
			filePath: "test.csv",
			range: { startRow: 4, startColumn: 27, endColumn: 28 },
		};
		expect(
			createSheetPlan(
				config,
				[
					["列", "列2"],
					["同じ", "更新"],
				],
				"hash",
				snapshot([
					["列", "列2"],
					["同じ", "以前"],
				]),
			).updates,
		).toEqual([{ range: "'シート''名'!AB5", values: [["更新"]] }]);
		const rangedEvent = {
			...eventConfig,
			range: { startRow: 4, startColumn: 2, endColumn: 5 },
		};
		expect(
			createSheetPlan(rangedEvent, [headers, added, oldA], "hash", snapshot([headers, oldA]))
				.inserts,
		).toEqual([{ rowIndex: 4, count: 1 }]);
	});
});

describe("計画とスナップショットの検証", () => {
	test("APIが省略した末尾空セルと空行は等価だが型、数式と行数は区別する", () => {
		const compact = snapshot([["列"], ["0"]]);
		const padded = snapshot([["列", ""], ["0", ""], []], [[], [], []]);
		expect(snapshotsEqual(compact, padded)).toBe(true);
		const numeric = snapshot([["列"], ["0"]]);
		numeric.raw[1][0] = 0;
		expect(snapshotsEqual(compact, numeric)).toBe(false);
		expect(snapshotsEqual(compact, { ...compact, formulas: [[], ["=0"]] })).toBe(false);
		expect(snapshotsEqual({ ...compact, rowCount: 100 }, { ...compact, rowCount: 101 })).toBe(
			false,
		);
		const withFormula = normalizeSnapshot({
			...snapshot([["列"], []], [[], ['=""']]),
			rowCount: 100,
		});
		expect(withFormula.formatted).toHaveLength(2);
		expect(withFormula.rowCount).toBe(100);
	});

	test("不正スナップショットと設定範囲超過を拒否する", () => {
		expect(() => validateSnapshot({ ...snapshot([]), raw: [[null]] })).toThrow(
			"スナップショット",
		);
		expect(() => validateSnapshot({ ...snapshot([]), sheetId: -1 })).toThrow(
			"スナップショット",
		);
		expect(() =>
			createSheetPlan(
				{ ...eventConfig, range: { endRow: 2 } },
				[headers, oldA, added],
				"hash",
				snapshot([headers, oldA]),
			),
		).toThrow("設定範囲");
		expect(() =>
			createSheetPlan(
				{ ...eventConfig, range: { endColumn: 3 } },
				[headers, oldA],
				"hash",
				snapshot([headers, oldA]),
			),
		).toThrow("列数");
	});

	test("直列化した計画を検証し操作列の改変を拒否する", () => {
		const plan = envelope(
			createSheetPlan(eventConfig, [headers, added, oldA], "hash", snapshot([headers, oldA])),
		);
		expect(() => validateSyncPlan(JSON.parse(JSON.stringify(plan)))).not.toThrow();
		const changedInsert = structuredClone(plan);
		changedInsert.sheets[0].inserts[0].count = 2;
		expect(() => validateSyncPlan(changedInsert)).toThrow("inserts");
		const changedUpdate = structuredClone(plan);
		changedUpdate.sheets[0].updates[0].range = "'別シート'!A1";
		expect(() => validateSyncPlan(changedUpdate)).toThrow("updates");
		const duplicate = { ...plan, sheets: [plan.sheets[0], plan.sheets[0]] };
		expect(() => validateSyncPlan(duplicate)).toThrow("重複");
	});

	test("計画は元CSVと取得スナップショットの変更に影響されない", () => {
		const local = [headers.slice(), oldA.slice()];
		const base = snapshot([headers.slice(), oldA.slice()]);
		const plan = createSheetPlan(eventConfig, local, "hash", base);
		local[1][0] = "変更";
		base.formatted[1][0] = "変更";
		expect(plan.local[1][0]).toBe("イベントA");
		expect(plan.base.formatted[1][0]).toBe("イベントA");
	});
});
