import { BasicStatus } from "@/types/common";
import { FriendsDataRow, MegumiPattern, megumiRaiseStatus } from "@/types/friends";
import { FriendsStatusListItem } from "@/types/friends";
import { getFriendsData } from "./friendsData";
import { calcKemosute } from "./common";
import { toPercent } from "./common";

export function isStatusNull(status: BasicStatus): boolean {
	return status.hp === null || status.atk === null || status.def === null;
}

export function getInitialLv(rarityOrFriendsDataRow: number | FriendsDataRow): number {
	if (typeof rarityOrFriendsDataRow === 'number') {
		return rarityOrFriendsDataRow * 10 + 3;
	} else {
		return rarityOrFriendsDataRow.rarity * 10 + 3;
	}
}

const lv99Correction = 1.093632809;

export function getLv99FromLv90(lv90: BasicStatus): BasicStatus {
	if (lv90.hp === null || lv90.atk === null || lv90.def === null) {
		return {
			hp: null,
			atk: null,
			def: null,
		} as BasicStatus;
	}
	return {
		hp: Math.ceil(lv90.hp * lv99Correction),
		atk: Math.ceil(lv90.atk * lv99Correction),
		def: Math.ceil(lv90.def * lv99Correction),
		estimated: true
	} as BasicStatus;
}

function calculateFriendsStatusRaw(
	lv: number,
	rank: number,
	yasei: 0 | 4 | 5,
	lv1: number | null,
	lv90: number | null,
	lv99: number | null,
	yasei4: number | null,
	yasei5: number | null
): number | null {
	const rankCorrection = 1 + (rank - 1) * 0.02;

	const yaseiValue =
		yasei === 0 ? 0
		: yasei === 4 ? (yasei4 ?? 0)
		: yasei === 5 ? (yasei5 ?? 0)
		: 0;

	// nullの値を0に置き換える
	const lv1Value = lv1 ?? 0;
	const lv90Value = lv90 ?? 0;
	const lv99Value = lv99 ?? 0;

	if (lv <= 90) {
		return Math.ceil(
			Math.floor(
				(lv90Value - lv1Value) / 89 * (lv - 1)
				+ lv1Value + yaseiValue
			) * rankCorrection
		);
	} else {
		return Math.ceil(
			Math.floor(
				(lv99Value - lv90Value) / 9 * (lv - 90)
				+ lv90Value + yaseiValue
			) * rankCorrection
		);
	}
}

function calculateFriendsStatusRawForEachParam(
	friendsDataRow: FriendsDataRow,
	lv: number,
	rank: number,
	yasei: 0 | 4 | 5,
): BasicStatus {
	return {
		hp: calculateFriendsStatusRaw(
			lv, rank, yasei,
			friendsDataRow.status.statusBase.lv1.hp,
			friendsDataRow.status.statusBase.lv90.hp,
			friendsDataRow.status.statusBase.lv99.hp,
			friendsDataRow.status.statusBase.yasei4.hp,
			friendsDataRow.status.statusBase.yasei5.hp
		),
		atk: calculateFriendsStatusRaw(
			lv, rank, yasei,
			friendsDataRow.status.statusBase.lv1.atk,
			friendsDataRow.status.statusBase.lv90.atk,
			friendsDataRow.status.statusBase.lv99.atk,
			friendsDataRow.status.statusBase.yasei4.atk,
			friendsDataRow.status.statusBase.yasei5.atk
		),
		def: calculateFriendsStatusRaw(
			lv, rank, yasei,
			friendsDataRow.status.statusBase.lv1.def,
			friendsDataRow.status.statusBase.lv90.def,
			friendsDataRow.status.statusBase.lv99.def,
			friendsDataRow.status.statusBase.yasei4.def,
			friendsDataRow.status.statusBase.yasei5.def
		),
		estimated: true
	}
}

/**
 * フレンズのステータスを計算する
 * @param friendsDataRow フレンズのデータ
 * @param lv レベル
 * @param rank けも級
 * @param yasei 野生解放の段階。0: 野生解放なし, 4: 野生解放4, 5: 野生解放5
 * @returns ステータス。計算できない場合はhp, atk, defがnullのBasicStatusを返す
 */
export function calculateFriendsStatus(
	friendsDataRow: FriendsDataRow,
	lv: number,
	rank: number,
	yasei: 0 | 4 | 5
): BasicStatus {
	const nullStatus = {
		hp: null,
		atk: null,
		def: null,
		estimated: true
	};

	const initialLv = getInitialLv(friendsDataRow);

	const isYaseiAvailable: boolean =
		yasei === 4 ? !isStatusNull(friendsDataRow.status.statusBase.yasei4)
		: yasei === 5 ? !isStatusNull(friendsDataRow.status.statusBase.yasei5)
		: yasei === 0 ? true
		: false;

	// Lv.100以上はLv99のステータス+めぐみ上昇値で計算
	if (lv >= 100) {
		if (friendsDataRow.status.statusBase.megumiPattern === MegumiPattern.unknown) {
			return nullStatus;
		}

		const statusLv99 = calculateFriendsStatus(friendsDataRow, 99, rank, yasei);

		if (statusLv99.hp === null || statusLv99.atk === null || statusLv99.def === null) {
			return nullStatus;
		}

		const megumiRaise = megumiRaiseStatus[friendsDataRow.status.statusBase.megumiPattern];
		return {
			hp: statusLv99.hp + megumiRaise.hp * (lv - 99),
			atk: statusLv99.atk + megumiRaise.atk * (lv - 99),
			def: statusLv99.def + megumiRaise.def * (lv - 99),
			estimated: statusLv99.estimated
		};
	}

	// 初期ステータス: 計算なし
	else if (lv === initialLv && rank === friendsDataRow.rarity && yasei === 4) {
		return friendsDataRow.status.statusInitial;
	}

	else if (lv === 90) {
		// 計算なし
		if (rank === 6 && yasei === 4 && !isStatusNull(friendsDataRow.status.status90)) {
			return friendsDataRow.status.status90;
		} else if (rank === 6 && yasei === 5 && !isStatusNull(friendsDataRow.status.status90Yasei5)) {
			return friendsDataRow.status.status90Yasei5;
		}
		// 計算
		if (isYaseiAvailable && !isStatusNull(friendsDataRow.status.statusBase.lv90)) {
			return calculateFriendsStatusRawForEachParam(friendsDataRow, lv, rank, yasei);
		}
	}

	else if (lv === 99) {
		// 計算なし
		if (rank === 6 && yasei === 4 && !isStatusNull(friendsDataRow.status.status99)) {
			return friendsDataRow.status.status99;
		} else if (rank === 6 && yasei === 5 && !isStatusNull(friendsDataRow.status.status99Yasei5)) {
			return friendsDataRow.status.status99Yasei5;
		}
		// 計算
		if (isYaseiAvailable && !isStatusNull(friendsDataRow.status.statusBase.lv99)) {
			return calculateFriendsStatusRawForEachParam(friendsDataRow, lv, rank, yasei);
		}
	}

	else if (lv === 1){
		if (isYaseiAvailable && !isStatusNull(friendsDataRow.status.statusBase.lv1)) {
			return calculateFriendsStatusRawForEachParam(friendsDataRow, lv, rank, yasei);
		}
	}

	// Lv 2-89, 91-98
	else if (isYaseiAvailable && !isStatusNull(friendsDataRow.status.statusBase.lv90)) {
		if (
			lv >= 2 && lv <= 89
			&& !isStatusNull(friendsDataRow.status.statusBase.lv1)
		) {
			return calculateFriendsStatusRawForEachParam(friendsDataRow, lv, rank, yasei);
		}

		if (
			lv >= 91 && lv <= 98
			&& !isStatusNull(friendsDataRow.status.statusBase.lv99)
		) {
			return calculateFriendsStatusRawForEachParam(friendsDataRow, lv, rank, yasei);
		}
	}

	return nullStatus;
}

// 事前計算済みのデータ型
export interface ProcessedFriendsStatusListItem extends FriendsStatusListItem {
	sortValues: {
		name: string;
		attribute: FriendsDataRow["attribute"];
		kemosute: number;
		hp: number;
		atk: number;
		def: number;
		avoid: number;
		// 衣装補正込みのステータス
		kemosuteWithCostume: number;
		hpWithCostume: number;
		atkWithCostume: number;
		defWithCostume: number;
	};
	displayValues: {
		kemosute: string;
		hp: string;
		atk: string;
		def: string;
		avoid: string;
	};
	originalIndex: number;
}

// 衣装補正の計算
function calculateCostumeBonus(numCostumes: number, has12poke: boolean): BasicStatus {
	// ☆6衣装所持想定
	const n = numCostumes + 2 + (has12poke ? 2 : 0);
	return {
		kemosute: 280 * n,
		hp: 100 * n,
		atk: 50 * n,
		def: 25 * n,
	};
}

// 衣装補正込みのステータスを計算
function calculateStatusWithCostume(
	baseValue: number | null,
	costumeBonus: number
): { value: number | null; bonus: number } {
	if (baseValue === null) {
		return { value: null, bonus: costumeBonus };
	}
	return { value: baseValue + costumeBonus, bonus: costumeBonus };
}

export async function getFriendsStatusList(): Promise<ProcessedFriendsStatusListItem[]> {
	const friendsData = await getFriendsData();

	// メモリ効率のため、一度に1つのフレンズのデータを処理
	const result: ProcessedFriendsStatusListItem[] = [];
	let index = 0;

	for (const friend of friendsData) {
		// 各ステータスタイプのデータを生成
		const statusTypes = [
			{
				level: 90,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status90,
				statusType: '☆6/Lv90/野生4' as const
			},
			{
				level: 99,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status99,
				statusType: '☆6/Lv99/野生4' as const
			},
			{
				level: 200,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status200,
				statusType: '☆6/Lv200/野生4' as const
			},
			...(friend.hasYasei5 ? [
				{
					level: 90,
					rank: 6,
					yasei: 5 as const,
					status: friend.status.status90Yasei5,
					statusType: '☆6/Lv90/野生5' as const
			},
			{
				level: 99,
				rank: 6,
				yasei: 5 as const,
				status: friend.status.status99Yasei5,
				statusType: '☆6/Lv99/野生5' as const
			},
			{
				level: 200,
				rank: 6,
				yasei: 5 as const,
				status: friend.status.status200Yasei5,
					statusType: '☆6/Lv200/野生5' as const
				}
			] : [])
		];

		for (const statusType of statusTypes) {
			const kemosute = calcKemosute(statusType.status);

			// 衣装補正の計算（仮の衣装数として2を使用）
			const costumeBonus = calculateCostumeBonus(friend.numOfClothes, friend.has12poke);

			// 衣装補正込みのステータスを計算
			const kemosuteWithCostume = calculateStatusWithCostume(kemosute, costumeBonus.kemosute ?? 0);
			const hpWithCostume = calculateStatusWithCostume(statusType.status.hp, costumeBonus.hp ?? 0);
			const atkWithCostume = calculateStatusWithCostume(statusType.status.atk, costumeBonus.atk ?? 0);
			const defWithCostume = calculateStatusWithCostume(statusType.status.def, costumeBonus.def ?? 0);

			result.push({
				friendsDataRow: friend,
				level: statusType.level,
				rank: statusType.rank,
				yasei: statusType.yasei,
				status: statusType.status,
				statusType: statusType.statusType,
				// ソート用の数値データを事前計算
				sortValues: {
					name: friend.name,
					attribute: friend.attribute,
					kemosute: kemosute === null ? -Infinity : kemosute,
					hp: statusType.status.hp === null ? -Infinity : statusType.status.hp,
					atk: statusType.status.atk === null ? -Infinity : statusType.status.atk,
					def: statusType.status.def === null ? -Infinity : statusType.status.def,
					avoid: friend.status.avoid === null ? -Infinity : friend.status.avoid,
					kemosuteWithCostume: kemosuteWithCostume.value === null ? -Infinity : kemosuteWithCostume.value,
					hpWithCostume: hpWithCostume.value === null ? -Infinity : hpWithCostume.value,
					atkWithCostume: atkWithCostume.value === null ? -Infinity : atkWithCostume.value,
					defWithCostume: defWithCostume.value === null ? -Infinity : defWithCostume.value,
				},
				// 表示用の文字列を事前計算
				displayValues: {
					kemosute: kemosute === null ? "?????" : Math.round(kemosute).toLocaleString(),
					hp: statusType.status.hp === null ? "?????" : statusType.status.hp.toLocaleString(),
					atk: statusType.status.atk === null ? "?????" : statusType.status.atk.toLocaleString(),
					def: statusType.status.def === null ? "?????" : statusType.status.def.toLocaleString(),
					avoid: friend.status.avoid === null ? "???%" : toPercent((statusType.yasei === 5 ? friend.status.avoidYasei5 : friend.status.avoid) ?? -1, 1)
				},
				originalIndex: index++,
			});
		}
	}

	return result;
}