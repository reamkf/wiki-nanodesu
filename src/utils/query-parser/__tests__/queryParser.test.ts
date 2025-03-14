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
			const parser = new QueryParser('測定) 掃除');
			const evaluator = parser.parse();
			expect(evaluator('テスト')).toBe(false);
			expect(evaluator('定)')).toBe(false);
			expect(evaluator('測定)と掃除')).toBe(true);
		});

		test('不正な括弧（閉じ括弧なし）', () => {
			const parser = new QueryParser('測定 (掃除');
			const evaluator = parser.parse();
			expect(evaluator('テスト')).toBe(false);
			expect(evaluator('(掃')).toBe(false);
			expect(evaluator('(掃除測定')).toBe(true);
		});

		describe('不正な演算子', () => {
			test('不正なAND（右オペランドなし）', () => {
				const parser = new QueryParser('測定 掃除 AND');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('測定掃除')).toBe(false);
				expect(evaluator('測定掃除AND')).toBe(true);
			});

			test('不正なOR（右オペランドなし）', () => {
				const parser = new QueryParser('測定 掃除 OR');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('測定掃除')).toBe(false);
				expect(evaluator('測定掃除OR')).toBe(true);
			});

			test('不正なAND（左オペランドなし）', () => {
				const parser = new QueryParser('AND 測定 掃除');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('測定掃除')).toBe(false);
				expect(evaluator('測定掃除AND')).toBe(true);
			});

			test('不正なOR（左オペランドなし）', () => {
				const parser = new QueryParser('OR 測定 掃除');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('測定掃除')).toBe(false);
				expect(evaluator('測定掃除OR')).toBe(true);
			});

			test('不正なNOT（右オペランドなし）', () => {
				const parser = new QueryParser('a-');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('測定掃除')).toBe(false);
				expect(evaluator('測定a-掃除')).toBe(true);
			});
		});

		describe('その他のエラー', () => {
			test('()単体', () => {
				const parser = new QueryParser('()');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('測定()掃除')).toBe(true);
			});

			test('ANDの後にOR', () => {
				const parser = new QueryParser('aaa and or');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('aaa掃除')).toBe(false);
				expect(evaluator('or掃除')).toBe(false);
				expect(evaluator('aaa測定or掃除')).toBe(true);
			});

			test('ORの後にAND', () => {
				const parser = new QueryParser('aaa or and');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('aaa測定掃除')).toBe(true);
				expect(evaluator('測定and掃除')).toBe(true);
			});

			test('ANDの前に-', () => {
				const parser = new QueryParser('aaa -and');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('aaa掃除')).toBe(false);
				expect(evaluator('掃除-and')).toBe(false);
				expect(evaluator('aaa掃除and')).toBe(false);
				expect(evaluator('aaa測定-and掃除')).toBe(true);
			});

			test('ORの前に-', () => {
				const parser = new QueryParser('aaa -or');
				const evaluator = parser.parse();
				expect(evaluator('テスト')).toBe(false);
				expect(evaluator('aaa掃除')).toBe(false);
				expect(evaluator('aaa測定-or掃除')).toBe(true);
			});

			test('閉じ括弧の前に-', () => {
				const parser = new QueryParser('(aaa -)');
				const evaluator = parser.parse();
				expect(evaluator('aaa測定-or掃除')).toBe(true);
			});
		});
	});
});