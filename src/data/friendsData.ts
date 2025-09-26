import { FriendsDataRow, FriendsAttribute, MegumiPattern, FriendsStatus, RawFriendsCSV } from "@/types/friends";
import { BasicStatus } from "@/types/friendsOrPhoto";
import { calculateFriendsStatus, getLv99FromLv90, isStatusNull } from "@/utils/friends/friendsStatus";
import { PhotoAttribute } from "@/types/photo";
import { readCsv } from '../utils/readCsv';
import { parseNumericValue } from '@/utils/common';


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
		kemosute: parseNumericValue(kemosute),
		hp: parseNumericValue(hp),
		def: parseNumericValue(def),
		atk: parseNumericValue(atk),
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
		avoid: parseNumericValue(data.かいひ, true),
		avoidYasei5: parseNumericValue(data.かいひ野生5, true),
		plasm: parseNumericValue(data.ぷらずむ),
		beatFlags: parseNumericValue(data.Beatフラッグ),
		actionFlags: (typeof data.Actionフラッグ === 'string' ? data.Actionフラッグ.split(',') : [data.Actionフラッグ || 0]).map(Number),
		tryFlags: (typeof data.Tryフラッグ === 'string' ? data.Tryフラッグ.split(',') : [data.Tryフラッグ || 0]).map(Number),
		specialFlags: typeof data.Specialフラッグ === 'string'
			? data.Specialフラッグ.split(',').map(str => {
				const match = /^A(\d+)T(\d+)$/.exec(str);
				if (!match) {
					return null;
				}
				const [, action, tryValue] = match;
				return [Number(action), Number(tryValue)];
			}).filter((flag): flag is [number, number] => flag !== null)
			: null,
		flagDamageUp: {
			beat: parseNumericValue(data.Beat補正, false),
			action: parseNumericValue(data.Action補正, false),
			try: parseNumericValue(data.Try補正, false)
		},
		flagDamageUpYasei5: {
			beat: parseNumericValue(data.Beat補正野生5, false),
			action: parseNumericValue(data.Action補正野生5, false),
			try: parseNumericValue(data.Try補正野生5, false)
		},
		statusInitial: parseBasicStatus(
			parseNumericValue(data['Lv最大けもステ']),
			parseNumericValue(data['Lv最大たいりょく']),
			parseNumericValue(data['Lv最大こうげき']),
			parseNumericValue(data['Lv最大まもり']),
			false
		),
		status90: parseBasicStatus(
			data['Lv90けもステ'],
			parseNumericValue(data['Lv90たいりょく']),
			parseNumericValue(data['Lv90こうげき']),
			parseNumericValue(data['Lv90まもり']),
			false
		),
		status99: parseBasicStatus(
			data['Lv99けもステ'],
			parseNumericValue(data['Lv99たいりょく']),
			parseNumericValue(data['Lv99こうげき']),
			parseNumericValue(data['Lv99まもり']),
			false
		),
		status90Yasei5: parseBasicStatus(
			data['Lv90野生5けもステ'],
			parseNumericValue(data['Lv90野生5たいりょく']),
			parseNumericValue(data['Lv90野生5こうげき']),
			parseNumericValue(data['Lv90野生5まもり']),
			false
		),
		status99Yasei5: parseBasicStatus(
			data['Lv99野生5けもステ'],
			parseNumericValue(data['Lv99野生5たいりょく']),
			parseNumericValue(data['Lv99野生5こうげき']),
			parseNumericValue(data['Lv99野生5まもり']),
			false
		),
		status150: nullStatus,
		status150Yasei5: nullStatus,
		status200: nullStatus,
		status200Yasei5: nullStatus,
		statusBase: {
			lv1: parseBasicStatus(
				null,
				parseNumericValue(data['☆1Lv1たいりょく']),
				parseNumericValue(data['☆1Lv1こうげき']),
				parseNumericValue(data['☆1Lv1まもり'])
			),
			lv90: parseBasicStatus(
				null,
				parseNumericValue(data['☆1Lv90たいりょく']),
				parseNumericValue(data['☆1Lv90こうげき']),
				parseNumericValue(data['☆1Lv90まもり'])
			),
			lv99: parseBasicStatus(
				null,
				parseNumericValue(data['☆1Lv99たいりょく']),
				parseNumericValue(data['☆1Lv99こうげき']),
				parseNumericValue(data['☆1Lv99まもり'])
			),
			yasei4: parseBasicStatus(
				null,
				parseNumericValue(data['☆1野生解放1-4合計たいりょく']),
				parseNumericValue(data['☆1野生解放1-4合計こうげき']),
				parseNumericValue(data['☆1野生解放1-4合計まもり']),
			),
			yasei5: parseBasicStatus(
				null,
				parseNumericValue(data['☆1野生解放1-5合計たいりょく']),
				parseNumericValue(data['☆1野生解放1-5合計こうげき']),
				parseNumericValue(data['☆1野生解放1-5合計まもり'])
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

let friendsDataCache: FriendsDataRow[] | null = null;

export async function getFriendsData(): Promise<FriendsDataRow[]> {
	if (friendsDataCache) {
		return friendsDataCache;
	}

	return readCsv<RawFriendsCSV, FriendsDataRow>(
		'フレンズデータ.csv',
		{},
		async (data: RawFriendsCSV[]) => {
			const parsedData = await Promise.all(data.map(async (row) => {
				const convertToBoolean = (value: unknown): boolean => {
					if (typeof value === 'string') return value !== '';
					if (typeof value === 'boolean') return value;
					return false;
				};

				return {
					id: row.ID || '',
					name: row.フレンズ名 || '',
					secondName: row.属性違い二つ名 || '',
					isHc: convertToBoolean(row.HC),
					attribute: (row.属性 as FriendsAttribute) || FriendsAttribute.none,
					subAttribute: (row.サブ属性 as FriendsAttribute) || FriendsAttribute.none,
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
					status: await parseFriendsStatus(row),
					wildPhotoAttribute: (row.動物フォト属性 as PhotoAttribute) || PhotoAttribute.none,
					wildPhotoTrait: row.動物フォトとくせい効果変化前 || '',
					wildPhotoTraitChanged: row.動物フォトとくせい効果変化後 || '',
				};
			}));
			const filledData = await Promise.all(parsedData.map(async (dataRow) => {
				return await fillStatuses(dataRow);
			}));
			friendsDataCache = filledData;
			return filledData;
		}
	);
}

export async function getFriendsDataRow(id: string): Promise<FriendsDataRow | null> {
	const friendsData = await getFriendsData();
	return friendsData.find(friend => friend.id === id) || null;
}