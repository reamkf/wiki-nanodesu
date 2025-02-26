import { BasicStatus } from "@/types/common";

export function calcKemosute(hp: number | null, atk: number | null, def: number | null): number | null;
export function calcKemosute(status: BasicStatus): number | null;

export function calcKemosute(hpOrStatus: number | BasicStatus | null, atk?: number | null, def?: number | null): number | null {
	if (hpOrStatus === null) {
		return null;
	} else if (typeof hpOrStatus === 'number') {
		if (atk === null || def === null || atk === undefined || def === undefined) {
			throw new Error('atk and def are required when hp is a number');
		}
		return Math.ceil(hpOrStatus * 0.8 + atk * 3 + def * 2);
	} else if (typeof hpOrStatus === 'object') {
		if (hpOrStatus.hp === null || hpOrStatus.atk === null || hpOrStatus.def === null) {
			return null;
		}
		const kemosute = calcKemosute(hpOrStatus.hp, hpOrStatus.atk, hpOrStatus.def)
		hpOrStatus.kemosute = kemosute;
		return kemosute;
	}
	return null;
}

export const getEnumKeyByValue = (enumObj: Record<string, string>, value: string): string => {
	return Object.keys(enumObj).find(key => enumObj[key] === value) || '';
}

export function toPercent(value: number, minimumFractionDigits = 0): string {
	return `${value.toLocaleString(undefined, {style: 'percent', minimumFractionDigits: minimumFractionDigits})}`;
}
