export function isNumber(value: string): boolean {
	if(typeof value === 'number') {
		return true;
	}

	const regex = /^[0-9,]+(\.[0-9]+)?%?$/;
	return regex.test(value);
}


/**
 * %表記を含む文字列を数値に変換する関数
 * @param value 変換したい値
 * @param parseAsPercentage %表記の場合に100で割るかどうか (デフォルト: true)
 * @returns 変換後の数値、変換できない場合はnull
 */
export function parseNumericValue(value: unknown, parseAsPercentage: boolean = true): number | null {
	if (typeof value === 'number') return value;
	if (typeof value !== 'string') return null;

	// 空文字列やnullの場合
	if (!value || value.trim() === '') return null;

	// カンマを除去
	const cleanValue = value.replace(/,/g, '');

	// %表記の場合
	if (cleanValue.endsWith('%')) {
		const numericPart = cleanValue.slice(0, -1);
		const parsed = parseFloat(numericPart);
		if (isNaN(parsed)) return null;

		// parseAsPercentageがtrueの場合、100で割って小数に変換（6% → 0.06）
		// falseの場合、そのまま数値として扱う（6% → 6）
		return parseAsPercentage ? parsed / 100 : parsed;
	}

	// 通常の数値の場合
	const parsed = parseFloat(cleanValue);
	return isNaN(parsed) ? null : parsed;
}

export function toPercent(value: number, minimumFractionDigits: number | null = null): string {
	if (minimumFractionDigits === null) {
		// 小数点以下の桁数を計算
		const decimalPlaces = (Math.round(value * 100 * 100000) / 100000).toString().split('.')[1]?.length || 0;
		return `${value.toLocaleString(undefined, {style: 'percent', minimumFractionDigits: decimalPlaces})}`;
	} else {
		return `${value.toLocaleString(undefined, {style: 'percent', minimumFractionDigits: minimumFractionDigits})}`;
	}
}
