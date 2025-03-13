export function isNumber(value: string): boolean {
	if(typeof value === 'number') {
		return true;
	}

	const regex = /^[0-9,]+(\.[0-9]+)?%?$/;
	return regex.test(value);
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
