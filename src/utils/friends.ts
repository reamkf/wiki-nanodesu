import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { FriendsDataRow, FriendsAttribute, MegumiPattern, FriendsStatus, RawFriendsCSV, RAW_FRIENDS_CSV_HEADERS, megumiRaiseStatus } from "@/types/friends";
import type { BasicStatus } from "@/types/common";

function convertToNumberElseNull(value: unknown): number | null {
	if (typeof value === 'number') return value;
	if (typeof value === 'string') return parseInt(value);
	return null;
}

/**
 * ベースステータスをパースする
 * @param kemosute けもステ
 * @param hp たいりょく
 * @param atk こうげき
 * @param def まもり
 */
function parseBasicStatus (
	kemosute: number | null,
	hp: number | null,
	atk: number | null,
	def: number | null,
	estimated: boolean = true
): BasicStatus {
	return {
		kemosute: convertToNumberElseNull(kemosute),
		hp: convertToNumberElseNull(hp),
		def: convertToNumberElseNull(def),
		atk: convertToNumberElseNull(atk),
		estimated: estimated
	};
}

function convertMegumiPattern(value: string | null): MegumiPattern {
	if (typeof value === 'string') {
		const pattern = Object.values(MegumiPattern).find(p => p === value);
		return pattern || MegumiPattern.balanced;
	}
	return MegumiPattern.unknown;
};

function parseFriendsStatus(data: RawFriendsCSV): FriendsStatus {
	const nullStatus = {
		hp: null,
		atk: null,
		def: null
	};

	return {
		avoid: convertToNumberElseNull(data.かいひ),
		avoidYasei5: convertToNumberElseNull(data.かいひ野生5),
		plasm: convertToNumberElseNull(data.ぷらずむ),
		beatFlags: convertToNumberElseNull(data.Beatフラッグ),
		actionFlags: (typeof data.Actionフラッグ === 'string' ? data.Actionフラッグ.split(',') : [data.Actionフラッグ || 0]).map(Number),
		tryFlags: (typeof data.Tryフラッグ === 'string' ? data.Tryフラッグ.split(',') : [data.Tryフラッグ || 0]).map(Number),
		flagDamageUp: {
			beat: convertToNumberElseNull(data.Beat補正),
			action: convertToNumberElseNull(data.Action補正),
			try: convertToNumberElseNull(data.Try補正)
		},
		flagDamageUpYasei5: {
			beat: convertToNumberElseNull(data.Beat補正野生5),
			action: convertToNumberElseNull(data.Action補正野生5),
			try: convertToNumberElseNull(data.Try補正野生5)
		},
		statusInitial: parseBasicStatus(
			convertToNumberElseNull(data['Lv最大けもステ']),
			convertToNumberElseNull(data['Lv最大たいりょく']),
			convertToNumberElseNull(data['Lv最大こうげき']),
			convertToNumberElseNull(data['Lv最大まもり']),
			false
		),
		status90: parseBasicStatus(
			data['Lv90けもステ'],
			convertToNumberElseNull(data['Lv90たいりょく']),
			convertToNumberElseNull(data['Lv90こうげき']),
			convertToNumberElseNull(data['Lv90まもり']),
			false
		),
		status99: parseBasicStatus(
			data['Lv99けもステ'],
			convertToNumberElseNull(data['Lv99たいりょく']),
			convertToNumberElseNull(data['Lv99こうげき']),
			convertToNumberElseNull(data['Lv99まもり']),
			false
		),
		status90Yasei5: parseBasicStatus(
			data['Lv90野生5けもステ'],
			convertToNumberElseNull(data['Lv90野生5たいりょく']),
			convertToNumberElseNull(data['Lv90野生5こうげき']),
			convertToNumberElseNull(data['Lv90野生5まもり']),
			false
		),
		status99Yasei5: parseBasicStatus(
			data['Lv99野生5けもステ'],
			convertToNumberElseNull(data['Lv99野生5たいりょく']),
			convertToNumberElseNull(data['Lv99野生5こうげき']),
			convertToNumberElseNull(data['Lv99野生5まもり']),
			false
		),
		status150: nullStatus,
		status150Yasei5: nullStatus,
		status200: nullStatus,
		status200Yasei5: nullStatus,
		statusBase: {
			lv1: parseBasicStatus(
				null,
				convertToNumberElseNull(data['☆1Lv1たいりょく']),
				convertToNumberElseNull(data['☆1Lv1こうげき']),
				convertToNumberElseNull(data['☆1Lv1まもり'])
			),
			lv90: parseBasicStatus(
				null,
				convertToNumberElseNull(data['Lv90たいりょく']),
				convertToNumberElseNull(data['Lv90こうげき']),
				convertToNumberElseNull(data['Lv90まもり'])
			),
			lv99: parseBasicStatus(
				null,
				convertToNumberElseNull(data['Lv99たいりょく']),
				convertToNumberElseNull(data['Lv99こうげき']),
				convertToNumberElseNull(data['Lv99まもり'])
			),
			yasei4: parseBasicStatus(
				null,
				convertToNumberElseNull(data['☆1野生解放1-4合計たいりょく']),
				convertToNumberElseNull(data['☆1野生解放1-4合計こうげき']),
				convertToNumberElseNull(data['☆1野生解放1-4合計まもり']),
			),
			yasei5: parseBasicStatus(
				null,
				convertToNumberElseNull(data['☆1野生解放1-5合計たいりょく']),
				convertToNumberElseNull(data['☆1野生解放1-5合計こうげき']),
				convertToNumberElseNull(data['☆1野生解放1-5合計まもり'])
			),
			megumiPattern: convertMegumiPattern(data['Lv100+上昇パターン'])
		}
	};
};

function fillStatuses(friendsDataRow: FriendsDataRow): FriendsDataRow {
	const status90 = calculateFriendsStatus(friendsDataRow, 90, 1, 4);
	const status99 = calculateFriendsStatus(friendsDataRow, 99, 1, 4);
	const status150 = calculateFriendsStatus(friendsDataRow, 150, 1, 4);
	const status200 = calculateFriendsStatus(friendsDataRow, 200, 1, 4);
	const status90Yasei5 = calculateFriendsStatus(friendsDataRow, 90, 1, 5);
	const status99Yasei5 = calculateFriendsStatus(friendsDataRow, 99, 1, 5);
	const status150Yasei5 = calculateFriendsStatus(friendsDataRow, 150, 1, 5);
	const status200Yasei5 = calculateFriendsStatus(friendsDataRow, 200, 1, 5);

	return {
		...friendsDataRow,
		status: {
			...friendsDataRow.status,
			status90,
			status99,
			status150,
			status200,
			status90Yasei5,
			status99Yasei5,
			status150Yasei5,
			status200Yasei5
		}
	};
}

export async function getFriendsData(): Promise<FriendsDataRow[]> {
    const csvPath = join(process.cwd(), "csv", "フレンズデータ.csv");
    const csvFile = readFileSync(csvPath, "utf-8");

    return new Promise<FriendsDataRow[]>((resolve) => {
        Papa.parse(csvFile, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => {
                return RAW_FRIENDS_CSV_HEADERS.includes(header as typeof RAW_FRIENDS_CSV_HEADERS[number]) ? header : '';
            },
            complete: (results) => {
                const parsedData = (results.data as RawFriendsCSV[]).map((row) => {
					// 野生大解放と12ポケの値を変換
					const convertToBoolean = (value: unknown): boolean => {
						if (typeof value === 'string') return value === '〇';
						if (typeof value === 'boolean') return value;
						return false;
					};

					return {
						id: row.ID || '',
						name: row.フレンズ名 || '',
						second_name: row.属性違い二つ名 || '',
						attribute: (row.属性 as FriendsAttribute) || FriendsAttribute.friendry,
						implement_date: row.実装日 || '',
						implement_type: row.実装種別 || '',
						implement_type_detail: row.実装種別詳細 || '',
						list_index: row.一覧順 || 0,
						icon_url: row.アイコンURL || '',
						rarity: row.初期けも級 || 0,
						has_yasei5: convertToBoolean(row.野生大解放),
						has_12poke: convertToBoolean(row['12ポケ']),
						num_of_clothes: row.特別衣装数 || 0,
						cv: row.CV || '',
						status: parseFriendsStatus(row)
					};
                });
				const filledData = parsedData.map(fillStatuses);
                resolve(filledData);
            },
        });
    });
}

function isStatusNull(status: BasicStatus): boolean {
	return status.hp === null || status.atk === null || status.def === null;
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
	const runkCorrection = 1 + (rank - 1) * 0.02;

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
			) * runkCorrection
		);
	} else {
		return Math.ceil(
			Math.floor(
				(lv99Value - lv90Value) / 9 * (lv - 90)
				+ lv90Value + yaseiValue
			) * runkCorrection
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
 * @param yasei 野生解放の段階。0: 野生解放なし, 4: 野生解放14, 5: 野生解放5
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
		def: null
	};

	const initialLv = friendsDataRow.rarity * 10 + 3;

	const isYaseiAvailable: boolean =
		yasei === 4 ? friendsDataRow.status.statusBase.yasei4 !== null
		: yasei === 5 ? friendsDataRow.status.statusBase.yasei5 !== null
		: yasei === 0 ? friendsDataRow.status.statusBase.lv90 !== null
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
	else if (lv === initialLv && yasei === 4) {
		return friendsDataRow.status.statusInitial;
	}

	else if (lv === 90) {
		// 計算なし
		if (yasei === 4 && !isStatusNull(friendsDataRow.status.status90)) {
			return friendsDataRow.status.status90;
		} else if (yasei === 5 && !isStatusNull(friendsDataRow.status.status90Yasei5)) {
			return friendsDataRow.status.status90Yasei5;
		}
		// 計算
		if (isYaseiAvailable && !isStatusNull(friendsDataRow.status.statusBase.lv90)) {
			return calculateFriendsStatusRawForEachStatus(friendsDataRow, lv, rank, yasei);
		}
	}

	else if (lv === 99) {
		// 計算なし
		if (yasei === 4 && !isStatusNull(friendsDataRow.status.status99)) {
			return friendsDataRow.status.status99;
		} else if (yasei === 5 && !isStatusNull(friendsDataRow.status.status99Yasei5)) {
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
	else if (
		isYaseiAvailable
		&& !isStatusNull(friendsDataRow.status.statusBase.lv1)
		&& !isStatusNull(friendsDataRow.status.statusBase.lv90)
	) {
		return calculateFriendsStatusRawForEachStatus(friendsDataRow, lv, rank, yasei);
	}

	return nullStatus;
}