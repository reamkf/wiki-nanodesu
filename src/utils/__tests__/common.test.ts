import { describe, test, expect } from "bun:test";
import { toPercent, parseNumericValue } from "../common";

describe('toPercent()', () => {
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

describe('parseNumericValue', () => {
	describe('数値の場合', () => {
		test('数値をそのまま返す', () => {
			expect(parseNumericValue(42)).toBe(42);
			expect(parseNumericValue(3.14)).toBe(3.14);
			expect(parseNumericValue(0)).toBe(0);
		});
	});

	describe('文字列数値の場合', () => {
		test('文字列数値を数値に変換する', () => {
			expect(parseNumericValue('42')).toBe(42);
			expect(parseNumericValue('3.14')).toBe(3.14);
			expect(parseNumericValue('0')).toBe(0);
		});

		test('カンマ区切りの数値を正しく処理する', () => {
			expect(parseNumericValue('1,000')).toBe(1000);
			expect(parseNumericValue('12,345.67')).toBe(12345.67);
		});
	});

	describe('%表記の場合', () => {
		describe('parseAsPercentage = true (デフォルト)', () => {
			test('%表記を小数に変換する', () => {
				expect(parseNumericValue('6%')).toBe(0.06);
				expect(parseNumericValue('6.0%')).toBe(0.06);
				expect(parseNumericValue('25%')).toBe(0.25);
				expect(parseNumericValue('100%')).toBe(1);
				expect(parseNumericValue('0%')).toBe(0);
			});

			test('小数点のある%表記を正しく処理する', () => {
				expect(parseNumericValue('7.5%')).toBe(0.075);
				expect(parseNumericValue('0.5%')).toBe(0.005);
			});
		});

		describe('parseAsPercentage = false', () => {
			test('%表記をそのまま数値として扱う', () => {
				expect(parseNumericValue('6%', false)).toBe(6);
				expect(parseNumericValue('6.0%', false)).toBe(6);
				expect(parseNumericValue('25%', false)).toBe(25);
				expect(parseNumericValue('7.5%', false)).toBe(7.5);
			});
		});
	});

	describe('無効な値の場合', () => {
		test('nullを返す', () => {
			expect(parseNumericValue(null)).toBe(null);
			expect(parseNumericValue(undefined)).toBe(null);
			expect(parseNumericValue('')).toBe(null);
			expect(parseNumericValue('   ')).toBe(null);
			expect(parseNumericValue('abc')).toBe(null);
			expect(parseNumericValue('abc%')).toBe(null);
			expect(parseNumericValue('%')).toBe(null);
			expect(parseNumericValue({})).toBe(null);
			expect(parseNumericValue([])).toBe(null);
		});
	});
});
