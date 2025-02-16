import { BasicStatus } from "@/types/common";

export function calcKemosute(hp: number, atk: number, def: number): number;
export function calcKemosute(status: BasicStatus): number;

export function calcKemosute(hpOrStatus: number | BasicStatus, atk?: number, def?: number): number {
	if (typeof hpOrStatus === 'number') {
		if (atk === undefined || def === undefined) {
			throw new Error('atk and def are required when hp is a number');
		}
		return Math.floor(hpOrStatus * 0.8 + atk * 3 + def * 2);
	} else {
		const kemosute = calcKemosute(hpOrStatus.hp, hpOrStatus.atk, hpOrStatus.def)
		hpOrStatus.kemosute = kemosute;
		return kemosute;
	}
}