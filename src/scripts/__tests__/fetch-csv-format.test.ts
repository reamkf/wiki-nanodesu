import { expect, test } from "bun:test";
import { keepPercentFormatting } from "../../../scripts/fetch-csv-from-sheets";

test("百分率の表記ゆれは既存CSVの表記を保持する", () => {
	const previous = "フォト名,与ダメ増加\nA,5%\nB,12.50%\n";
	expect(
		keepPercentFormatting(previous, [
			["フォト名", "与ダメ増加"],
			["A", "5.0%"],
			["B", "12.5%"],
			["C", "7.0%"],
		]),
	).toEqual([
		["フォト名", "与ダメ増加"],
		["A", "5%"],
		["B", "12.50%"],
		["C", "7.0%"],
	]);
});

test("数値が変わる百分率は取得した値を使う", () => {
	const previous = "フォト名,与ダメ増加\nA,5%\n";
	const next = keepPercentFormatting(previous, [
		["フォト名", "与ダメ増加"],
		["A", "6.0%"],
	]);
	expect(next[1][1]).toBe("6.0%");
});

test("既存CSVがない場合は取得した値をそのまま使う", () => {
	const values = [
		["フォト名", "与ダメ増加"],
		["A", "5.0%"],
	];
	expect(keepPercentFormatting("", values)).toBe(values);
});
