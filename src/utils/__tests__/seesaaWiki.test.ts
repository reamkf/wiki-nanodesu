import { describe, test, expect } from 'bun:test';
import { getWikiNanodaPageUrl } from '../seesaaWiki';

const testCases = [
	{
		pageName: 'レガシー_スキル効果別フレンズ一覧/バフ・デバフ',
		expected: 'https://seesaawiki.jp/kemono_friends3_5ch/d/%a5%ec%a5%ac%a5%b7%a1%bc%5f%a5%b9%a5%ad%a5%eb%b8%fa%b2%cc%ca%cc%a5%d5%a5%ec%a5%f3%a5%ba%b0%ec%cd%f7/%a5%d0%a5%d5%a1%a6%a5%c7%a5%d0%a5%d5',
	},
	{
		pageName: 'わたしたちとあそぼ♡',
		expected: 'https://seesaawiki.jp/kemono_friends3_5ch/d/%a4%ef%a4%bf%a4%b7%a4%bf%a4%c1%a4%c8%a4%a2%a4%bd%a4%dc%26%239825%3b',
	},
	{
		pageName: 'Ｑ＆Ａ',
		expected: 'https://seesaawiki.jp/kemono_friends3_5ch/d/%a3%d1%a1%f5%a3%c1',
	},
	{
		pageName: 'シーサーバル道場（β2-29）',
		expected: 'https://seesaawiki.jp/kemono_friends3_5ch/d/%a5%b7%a1%bc%a5%b5%a1%bc%a5%d0%a5%eb%c6%bb%be%ec%a1%ca%a6%c22%2d29%a1%cb',
	},
	{
		pageName: 'Dear my friends',
		expected: 'https://seesaawiki.jp/kemono_friends3_5ch/d/Dear%20my%20friends',
	},
];

describe('ページURLの取得', () => {
	for (const testCase of testCases) {
		test(`${testCase.pageName}のページURLが正しい`, () => {
			const actual = getWikiNanodaPageUrl(testCase.pageName);
			expect(actual).toBe(testCase.expected);
		});
	}
});