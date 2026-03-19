declare module 'kuroshiro' {
	export default class Kuroshiro {
		init(analyzer: unknown): Promise<void>;
		convert(
			text: string,
			options?: { to?: 'hiragana' | 'katakana' | 'romaji'; mode?: string }
		): Promise<string>;
	}
}

declare module 'kuroshiro-analyzer-kuromoji' {
	export default class KuromojiAnalyzer {
		constructor(options?: unknown);
	}
}
