import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { FriendsDataRow, FriendsAttribute, MegumiPattern, FriendsStatus, RawFriendsCSV, RAW_FRIENDS_CSV_HEADERS } from "@/types/friends";
import type { BasicStatus } from "@/types/common";
import { calculateFriendsStatus, getLv99FromLv90, isStatusNull } from "./friendsStatus";

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

export async function parseFriendsStatus(data: RawFriendsCSV): Promise<FriendsStatus> {
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
				convertToNumberElseNull(data['☆1Lv90たいりょく']),
				convertToNumberElseNull(data['☆1Lv90こうげき']),
				convertToNumberElseNull(data['☆1Lv90まもり'])
			),
			lv99: parseBasicStatus(
				null,
				convertToNumberElseNull(data['☆1Lv99たいりょく']),
				convertToNumberElseNull(data['☆1Lv99こうげき']),
				convertToNumberElseNull(data['☆1Lv99まもり'])
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
}

export async function fillStatuses(friendsDataRow: FriendsDataRow): Promise<FriendsDataRow> {
	if(isStatusNull(friendsDataRow.status.statusBase.lv99) && !isStatusNull(friendsDataRow.status.statusBase.lv90)) {
		friendsDataRow.status.statusBase.lv99 = getLv99FromLv90(friendsDataRow.status.statusBase.lv90);
	}
	const status90 = await calculateFriendsStatus(friendsDataRow, 90, 6, 4);
	const status99 = await calculateFriendsStatus(friendsDataRow, 99, 6, 4);
	const status150 = await calculateFriendsStatus(friendsDataRow, 150, 6, 4);
	const status200 = await calculateFriendsStatus(friendsDataRow, 200, 6, 4);
	const status90Yasei5 = await calculateFriendsStatus(friendsDataRow, 90, 6, 5);
	const status99Yasei5 = await calculateFriendsStatus(friendsDataRow, 99, 6, 5);
	const status150Yasei5 = await calculateFriendsStatus(friendsDataRow, 150, 6, 5);
	const status200Yasei5 = await calculateFriendsStatus(friendsDataRow, 200, 6, 5);

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

    return new Promise<FriendsDataRow[]>(async (resolve) => {
        Papa.parse(csvFile, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => {
                return RAW_FRIENDS_CSV_HEADERS.includes(header as typeof RAW_FRIENDS_CSV_HEADERS[number]) ? header : '';
            },
            complete: async (results) => {
                const parsedData = await Promise.all((results.data as RawFriendsCSV[]).map(async (row) => {
					// 野生大解放と12ポケの値を変換
					const convertToBoolean = (value: unknown): boolean => {
						if (typeof value === 'string') return value !== '';
						if (typeof value === 'boolean') return value;
						return false;
					};

					return {
						id: row.ID || '',
						name: row.フレンズ名 || '',
						secondName: row.属性違い二つ名 || '',
						attribute: (row.属性 as FriendsAttribute) || FriendsAttribute.friendry,
						implementDate: row.実装日 || '',
						implementType: row.実装種別 || '',
						implementTypeDetail: row.実装種別詳細 || '',
						listIndex: row.一覧順 || 0,
						iconUrl: row.アイコンURL || '',
						rarity: row.初期けも級 || 0,
						hasYasei5: convertToBoolean(row.野生大解放),
						has12poke: convertToBoolean(row['12ポケ']),
						numOfClothes: row.特別衣装数 || 0,
						cv: row.CV || '',
						status: await parseFriendsStatus(row)
					};
                }));
				const filledData = await Promise.all(parsedData.map(async (data) => {
					return await fillStatuses(data);
				}));
                resolve(filledData);
            },
        });
    });
}

export async function getFriendsDataRow(id: string): Promise<FriendsDataRow | null> {
	const friendsData = await getFriendsData();
	return friendsData.find(friend => friend.id === id) || null;
}