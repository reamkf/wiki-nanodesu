import { normalizePath } from "@/app/metadata";
import { describe, test, expect } from "bun:test";

describe('normalizePath', () => {
	test('トップページの正規化', () => {
		const path = '/';
		const expected = 'https://reamkf.github.io/wiki-nanodesu/';
		const actual = normalizePath(path);
		expect(actual).toBe(expected);
	});

	test('先頭のスラッシュあり', () => {
		const path = '/friends-status';
		const expected = 'https://reamkf.github.io/wiki-nanodesu/friends-status';
		const actual = normalizePath(path);
		expect(actual).toBe(expected);
	});

	test('先頭のスラッシュなし', () => {
		const path = 'friends-status';
		const expected = 'https://reamkf.github.io/wiki-nanodesu/friends-status';
		const actual = normalizePath(path);
		expect(actual).toBe(expected);
	});

	test('wiki-nanodesu付き・先頭のスラッシュあり', () => {
		const path = '/wiki-nanodesu/friends-status';
		const expected = 'https://reamkf.github.io/wiki-nanodesu/friends-status';
		const actual = normalizePath(path);
		expect(actual).toBe(expected);
	});

	test('wiki-nanodesu付き・先頭のスラッシュなし', () => {
		const path = 'wiki-nanodesu/friends-status';
		const expected = 'https://reamkf.github.io/wiki-nanodesu/friends-status';
		const actual = normalizePath(path);
		expect(actual).toBe(expected);
	});
});