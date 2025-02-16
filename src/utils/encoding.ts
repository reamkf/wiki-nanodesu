import * as Encoding from 'encoding-japanese';

/**
 * 文字列をEUC-JPでエンコードし、URLエンコードする関数
 * @param input エンコードする文字列
 * @returns EUC-JPでエンコードされURLエンコードされた文字列
 */
export function encodeEUCJP(input: string): string {
	// 文字列をEUC-JPにエンコード
	const eucBytes = Encoding.convert(Encoding.stringToCode(input), {
		to: 'EUCJP',
		from: 'UNICODE'
	});

	// バイト配列を16進数文字列に変換
	let encoded = "";
	for (const byte of eucBytes) {
		// URLエンコードのルールに従って変換
		if (
			(byte >= 0x30 && byte <= 0x39) || // 0-9
			(byte >= 0x41 && byte <= 0x5A) || // A-Z
			(byte >= 0x61 && byte <= 0x7A) || // a-z
			byte === 0x2D || // -
			byte === 0x2E || // .
			byte === 0x5F || // _
			byte === 0x7E    // ~
		) {
			encoded += String.fromCharCode(byte);
		} else {
			encoded += "%" + byte.toString(16).toUpperCase().padStart(2, "0");
		}
	}

	return encoded;
}

/**
 * EUC-JPでエンコードされURLエンコードされた文字列をデコードする関数
 * @param input デコードする文字列
 * @returns デコードされた文字列
 */
export function decodeEUCJP(input: string): string {
	return new TextDecoder("euc-jp").decode(
		Uint8Array.from(
			input
				.split("%")
				.filter(Boolean)
				.map(hex => parseInt(hex, 16))
		)
	);
}