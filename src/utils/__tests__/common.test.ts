import { describe, test, expect } from "bun:test";
import { toPercent } from "../common";

describe('toPercent', () => {
	describe('小数点以下の桁数を自動計算', () => {
		test('1.000000をパーセントに変換すると100%になる', () => {
			expect(toPercent(1.000000)).toBe('100%');
		});

		test('0.123をパーセントに変換すると12.3%になる', () => {
			expect(toPercent(0.123)).toBe('12.3%');
		});

		test('1.234567をパーセントに変換すると123.4567%になる', () => {
			expect(toPercent(1.234567)).toBe('123.4567%');
		});

		test('0.06999999999999999をパーセントに変換すると7%になる', () => {
			expect(toPercent(0.06999999999999999)).toBe('7%');
		});
	});

	describe('小数点以下の桁数を指定', () => {
		test('1.234567を小数点以下0桁でパーセントに変換すると123%になる', () => {
			expect(toPercent(1.234567, 0)).toBe('123%');
		});

		test('1.234567を小数点以下1桁でパーセントに変換すると123.5%になる', () => {
			expect(toPercent(1.234567, 1)).toBe('123.5%');
		});
	});
});