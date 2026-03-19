/**
 * 漢字をひらがな（読み仮名）に変換するユーティリティ
 * Kuroshiro を使用して形態素解析により正確な読みを取得する
 */

import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

let kuroshiroInstance: Kuroshiro | null = null;
let initPromise: Promise<void> | null = null;

async function initKuroshiro(): Promise<Kuroshiro> {
	if (kuroshiroInstance) {
		return kuroshiroInstance;
	}
	if (initPromise) {
		await initPromise;
		return kuroshiroInstance!;
	}
	initPromise = (async () => {
		const kuroshiro = new Kuroshiro();
		await kuroshiro.init(new KuromojiAnalyzer());
		kuroshiroInstance = kuroshiro;
	})();
	await initPromise;
	return kuroshiroInstance!;
}

/**
 * 日本語テキストをひらがなに変換する
 * 漢字は読み仮名に、カタカナはひらがなに変換される
 * @param text 変換対象のテキスト
 * @returns ひらがなに変換されたテキスト（変換に失敗した場合は元のテキストを返す）
 */
export async function toHiragana(text: string): Promise<string> {
	if (!text || typeof text !== 'string') {
		return text;
	}
	try {
		const kuroshiro = await initKuroshiro();
		const result = await kuroshiro.convert(text, {
			to: 'hiragana',
			mode: 'normal',
		});
		return result;
	} catch {
		return text;
	}
}
