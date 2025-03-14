import { describe, test, expect } from "bun:test";
import { QueryParser } from '../queryParser';

describe('QueryParser', () => {
	test('単一単語の単純なクエリ', () => {
		const parser = new QueryParser('測定');
		const evaluator = parser.parse();
		expect(evaluator('測定あり')).toBe(true);
		expect(evaluator('何もなし')).toBe(false);
	});

	describe('基本演算子', () => {
		test('明示的なAND', () => {
			const parser = new QueryParser('測定 AND 掃除');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除')).toBe(true);
			expect(evaluator('測定のみ')).toBe(false);
			expect(evaluator('掃除のみ')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});

		test('暗黙的なAND', () => {
			const parser = new QueryParser('測定 掃除');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除')).toBe(true);
			expect(evaluator('測定のみ')).toBe(false);
			expect(evaluator('掃除のみ')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});

		test('OR', () => {
			const parser = new QueryParser('測定 OR 掃除');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除')).toBe(true);
			expect(evaluator('測定のみ')).toBe(true);
			expect(evaluator('掃除のみ')).toBe(true);
			expect(evaluator('何もなし')).toBe(false);
		});

		test('単純なNOT', () => {
			const parser = new QueryParser('-測定');
			const evaluator = parser.parse();
			expect(evaluator('なし')).toBe(true);
			expect(evaluator('測定あり')).toBe(false);
		});
	});

	describe('小文字のandとor', () => {
		test('明示的なAND', () => {
			const parser = new QueryParser('測定 and 掃除');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除')).toBe(true);
			expect(evaluator('測定のみ')).toBe(false);
			expect(evaluator('掃除のみ')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});

		test('OR', () => {
			const parser = new QueryParser('測定 or 掃除');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除')).toBe(true);
			expect(evaluator('測定のみ')).toBe(true);
			expect(evaluator('掃除のみ')).toBe(true);
			expect(evaluator('何もなし')).toBe(false);
		});
	});

	describe('複合演算子', () => {
		test('ANDとNOTの組み合わせ', () => {
			const parser = new QueryParser('掃除 -測定');
			const evaluator = parser.parse();
			expect(evaluator('掃除のみ')).toBe(true);
			expect(evaluator('測定のみ')).toBe(false);
			expect(evaluator('掃除と測定')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});

		test('ORとNOTの組み合わせ', () => {
			const parser = new QueryParser('掃除 OR -測定');
			const evaluator = parser.parse();
			expect(evaluator('掃除あり')).toBe(true);
			expect(evaluator('測定あり')).toBe(false);
			expect(evaluator('何もなし')).toBe(true);
			expect(evaluator('掃除あり測定あり')).toBe(true);
		});
	});

	describe('グルーピング', () => {
		test('単純な括弧', () => {
			const parser = new QueryParser('(測定 掃除)');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除')).toBe(true);
			expect(evaluator('測定のみ')).toBe(false);
			expect(evaluator('掃除のみ')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});

		test('冗長な括弧', () => {
			const parser = new QueryParser('((((測定)) (掃除)))');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除')).toBe(true);
			expect(evaluator('測定のみ')).toBe(false);
			expect(evaluator('掃除のみ')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});

		test('括弧とORの組み合わせ', () => {
			const parser = new QueryParser('予告 (測定 OR 掃除)');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除の予告')).toBe(true);
			expect(evaluator('測定の予告')).toBe(true);
			expect(evaluator('掃除の予告')).toBe(true);
			expect(evaluator('掃除のみ')).toBe(false);
			expect(evaluator('測定のみ')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});

		test('括弧とNOTの組み合わせ', () => {
			const parser = new QueryParser('(測定 -予告)');
			const evaluator = parser.parse();
			expect(evaluator('測定あり')).toBe(true);
			expect(evaluator('予告付きの測定')).toBe(false);
			expect(evaluator('予告のみ')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});
	});

	describe('複雑なクエリ', () => {
		test('複雑な組み合わせ1', () => {
			const parser = new QueryParser('測定 (掃除 OR -メンテナンス)');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除を実施')).toBe(true);
			expect(evaluator('測定のみを実施')).toBe(true);
			expect(evaluator('測定とメンテナンス')).toBe(false);
		});

		test('複雑な組み合わせ2', () => {
			const parser = new QueryParser('(測定 OR メンテナンス) -予告 掃除');
			const evaluator = parser.parse();
			expect(evaluator('測定と掃除')).toBe(true);
			expect(evaluator('メンテナンスと掃除を実施')).toBe(true);
			expect(evaluator('予告付きの測定と掃除')).toBe(false);
			expect(evaluator('何もなし')).toBe(false);
		});
	});

	describe('不正なクエリ', () => {
		test('不正な括弧（開き括弧なし）', () => {
			expect(() => {
				new QueryParser('測定) 掃除').parse()('テスト');
			}).toThrow();
		});

		test('不正な括弧（閉じ括弧なし）', () => {
			expect(() => {
				new QueryParser('測定 (掃除').parse()('テスト');
			}).toThrow();
		});

		describe('不正な演算子', () => {
			test('不正なAND（右オペランドなし）', () => {
				expect(() => {
					new QueryParser('測定 掃除 AND').parse()('テスト');
				}).toThrow();
			});

			test('不正なOR（右オペランドなし）', () => {
				expect(() => {
					new QueryParser('測定 掃除 OR').parse()('テスト');
				}).toThrow();
			});

			test('不正なAND（左オペランドなし）', () => {
				expect(() => {
					new QueryParser('AND 測定 掃除').parse()('テスト');
				}).toThrow();
			});

			test('不正なOR（左オペランドなし）', () => {
				expect(() => {
					new QueryParser('OR 測定 掃除').parse()('テスト');
				}).toThrow();
			});
		});

		describe('その他のエラー', () => {
			test('()単体', () => {
				expect(() => {
					new QueryParser('()').parse()('テスト');
				}).toThrow();
			});

			test('ANDの後にOR', () => {
				expect(() => {
					new QueryParser('aaa and or').parse()('テスト');
				}).toThrow();
			});

			test('ORの後にAND', () => {
				expect(() => {
					new QueryParser('aaa or and').parse()('テスト');
				}).toThrow();
			});

			test('ANDの前に-', () => {
				expect(() => {
					new QueryParser('aaa -and').parse()('テスト');
				}).toThrow();
			});

			test('ORの前に-', () => {
				expect(() => {
					new QueryParser('aaa -or').parse()('テスト');
				}).toThrow();
			});

			test('閉じ括弧の前に-', () => {
				expect(() => {
					new QueryParser('(aaa -)').parse()('テスト');
				}).toThrow();
			});
		});
	});
});