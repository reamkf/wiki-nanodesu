import { describe, expect, test } from 'bun:test';
import { toHiragana } from '../kanjiToHiragana';

describe('toHiragana', () => {
	test('空文字はそのまま返す', async () => {
		expect(await toHiragana('')).toBe('');
	});

	test('漢字をひらがなに変換する', async () => {
		expect(await toHiragana('状態異常')).toBe('じょうたいいじょう');
	});

	test('漢字とかな混在のテキストを変換する', async () => {
		expect(await toHiragana('隊長さん')).toBe('たいちょうさん');
		expect(await toHiragana('シーサーバル道場')).toBe('シーサーバルどうじょう');
	});

	test('漢字以外のテキストはそのまま返す', async () => {
		expect(await toHiragana('ひらがなカタカナABCabc!@#$%^&*()_+-=[]{}|;:,.<>?/ 　')).toBe('ひらがなカタカナABCabc!@#$%^&*()_+-=[]{}|;:,.<>?/ 　');
	});
});
