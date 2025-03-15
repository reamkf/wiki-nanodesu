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
			(byte >= 0x30 && byte <= 0x39) // 0-9
			|| (byte >= 0x41 && byte <= 0x5A) // A-Z
			|| (byte >= 0x61 && byte <= 0x7A) // a-z
			|| byte === 0x2E // .
			|| byte === 0x2F // /
		) {
			encoded += String.fromCharCode(byte);
		} else {
			encoded += "%" + byte.toString(16).toLowerCase().padStart(2, "0");
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
	// %xxの形式の文字列を抽出してバイト配列に変換
	const bytes = [];
	let i = 0;

	while (i < input.length) {
		if (input[i] === '%' && i + 2 < input.length) {
			// %xxの形式を16進数として解析
			const hex = input.substring(i + 1, i + 3);
			bytes.push(parseInt(hex, 16));
			i += 3;
		} else {
			// %xx形式でない文字はそのままバイトコードに変換
			bytes.push(input.charCodeAt(i));
			i++;
		}
	}

	// バイト配列をEUC-JPとしてデコード
	// encoding-japaneseを使用してデコード
	const decoded = Encoding.convert(bytes, {
		to: 'UNICODE',
		from: 'EUCJP'
	});

	return Encoding.codeToString(decoded);
}