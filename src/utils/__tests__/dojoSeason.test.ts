import { describe, test, expect } from "bun:test";
import { calculateSeasonCount, getDojoSeasonPageNames } from "../dojoSeason";

describe("calculateSeasonCount", () => {
	test("2020-08-01のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2020-08-01"))).toBe(2);
	});

	test("2020-09-30のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2020-09-30"))).toBe(2);
	});

	test("2020-10-01のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2020-10-01"))).toBe(3);
	});

	test("2020-11-30のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2020-11-30"))).toBe(3);
	});

	test("2020-12-01のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2020-12-01"))).toBe(4);
	});

	test("2021-01-31のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2021-01-31"))).toBe(4);
	});

	test("2024-06-01のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2024-06-01"))).toBe(25);
	});

	test("2024-07-31のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2024-07-31"))).toBe(25);
	});

	test("2024-08-01のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2024-08-01"))).toBe(26);
	});

	test("2024-09-30のカウントが正しい", () => {
		expect(calculateSeasonCount(new Date("2024-09-30"))).toBe(26);
	});
});

describe("getDojoSeasonPageNames", () => {
	test("全シーズンを降順で返し、β2-1とβ1のページ名を使う", () => {
		expect(getDojoSeasonPageNames(4)).toEqual([
			"シーサーバル道場（β2-4）",
			"シーサーバル道場（β2-3）",
			"シーサーバル道場（β2-2）",
			"シーサーバル道場（β2）",
			"シーサーバル道場",
		]);
	});
});
