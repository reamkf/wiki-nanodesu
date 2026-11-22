import { expect, test } from "bun:test";
import { fetchedCsv, keepPercentFormatting } from "../../../scripts/fetch-csv-from-sheets";

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

test("引用符の有無だけが異なる場合は既存CSVを保持する", () => {
	const previous = '名前,説明\nフクロオオカミ,"耐性を減少させる "\n';
	expect(fetchedCsv(previous, [["名前", "説明"], ["フクロオオカミ", "耐性を減少させる "]])).toBe(previous);
});

test("セルの値が変わった場合は新しいCSVを保存する", () => {
	const previous = '名前,説明\nフクロオオカミ,"耐性を減少させる "\n';
	expect(fetchedCsv(previous, [["名前", "説明"], ["フクロオオカミ", "耐性を増加させる "]])).toBe(
		"名前,説明\nフクロオオカミ,耐性を増加させる \n",
	);
});
