import { expect, test } from "bun:test";
import { reportViolations, validateCsv } from "../../../scripts/csv-validation";

const headers = [
	"フレンズID/フォト名",
	"わざ種別",
	"状態異常",
	"効果種別",
	"威力",
	"対象",
	"条件",
	"効果ターン",
	"発動率",
	"発動回数",
	"備考",
];

test("厳格な規則と警告のみの規則を区別し、空欄を許容する", () => {
	const rows = [headers, ["", "誤り", "", "", "未登録", "", "", "", "", "", ""]];
	const violations = validateCsv("状態異常スキル一覧.csv", rows);
	expect(violations).toEqual([
		{ row: 2, column: "わざ種別", value: "誤り", strict: true },
		{ row: 2, column: "威力", value: "未登録", strict: false },
	]);
	expect(() => reportViolations("test.csv", violations)).toThrow();
});

test("変更対象だけを検証し、参照先CSVのIDを照合する", () => {
	const rows = [headers, ["存在しないID", "けものミラクル", "", "", "", "", "", "", "", "", ""]];
	expect(
		validateCsv("状態異常スキル一覧.csv", rows, new Map([[2, new Set(["わざ種別"])]])),
	).toEqual([]);
	expect(validateCsv("状態異常スキル一覧.csv", rows)[0]).toEqual({
		row: 2,
		column: "フレンズID/フォト名",
		value: "存在しないID",
		strict: true,
	});
});
