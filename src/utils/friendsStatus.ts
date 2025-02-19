import { BasicStatus } from "@/types/common";
import { FriendsDataRow, MegumiPattern, megumiRaiseStatus } from "@/types/friends";
import { FriendsStatusListItem } from "@/types/friends";
import { getFriendsData } from "./friendsData";

function isStatusNull(status: BasicStatus): boolean {
	return status.hp === null || status.atk === null || status.def === null;
}

export function getInitialLv(rarityOrFriendsDataRow: number | FriendsDataRow): number {
	if (typeof rarityOrFriendsDataRow === 'number') {
		return rarityOrFriendsDataRow * 10 + 3;
	} else {
		return rarityOrFriendsDataRow.rarity * 10 + 3;
	}
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

function calculateFriendsStatusRawForEachStatus(
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
			return calculateFriendsStatusRawForEachStatus(friendsDataRow, lv, rank, yasei);
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
			return calculateFriendsStatusRawForEachStatus(friendsDataRow, lv, rank, yasei);
		}
	}

	else if (lv === 1){
		if (isYaseiAvailable && !isStatusNull(friendsDataRow.status.statusBase.lv1)) {
			return calculateFriendsStatusRawForEachStatus(friendsDataRow, lv, rank, yasei);
		}
	}

	// Lv 2-89
	else if (isYaseiAvailable) {
		// Lv 91-98
		if (
			lv >= 2 && lv <= 89
			&& !isStatusNull(friendsDataRow.status.statusBase.lv1)
			&& !isStatusNull(friendsDataRow.status.statusBase.lv90)
		) {
			return calculateFriendsStatusRawForEachStatus(friendsDataRow, lv, rank, yasei);
		}

		// Lv 91-98
		if (
			lv >= 91 && lv <= 98
			&& !isStatusNull(friendsDataRow.status.statusBase.lv90)
			&& !isStatusNull(friendsDataRow.status.statusBase.lv99)
		) {
			return calculateFriendsStatusRawForEachStatus(friendsDataRow, lv, rank, yasei);
		}
	}

	return nullStatus;
}

export async function getFriendsStatusList(): Promise<FriendsStatusListItem[]> {
	const friendsData = await getFriendsData();

	const result = await Promise.all(friendsData.map(async friend => {
		return [
			{
				friendsDataRow: friend,
				level: 90,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status90,
				statusType: '☆6/Lv90/野生4' as const
			},
			{
				friendsDataRow: friend,
				level: 99,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status99,
				statusType: '☆6/Lv99/野生4' as const
			},
			{
				friendsDataRow: friend,
				level: 200,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status200,
				statusType: '☆6/Lv200/野生4' as const
			},
			{
				friendsDataRow: friend,
				level: 90,
				rank: 6,
				yasei: 5 as const,
				status: friend.status.status90Yasei5,
				statusType: '☆6/Lv90/野生5' as const
			},
			{
				friendsDataRow: friend,
				level: 99,
				rank: 6,
				yasei: 5 as const,
				status: friend.status.status99Yasei5,
				statusType: '☆6/Lv99/野生5' as const
			},
			{
				friendsDataRow: friend,
				level: 200,
				rank: 6,
				yasei: 5 as const,
				status: friend.status.status200Yasei5,
				statusType: '☆6/Lv200/野生5' as const
			}
		];
	}));

	return result.flat();
}