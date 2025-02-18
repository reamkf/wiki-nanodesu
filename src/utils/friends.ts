import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { FriendsDataRow, FriendsAttribute, MegumiPattern, FriendsStatus, RawFriendsCSV, RAW_FRIENDS_CSV_HEADERS } from "@/types/friends";
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
	def: number | null
): BasicStatus {
	return {
		kemosute: convertToNumberElseNull(kemosute),
		hp: convertToNumberElseNull(hp),
		def: convertToNumberElseNull(def),
		atk: convertToNumberElseNull(atk)
	};
}

const convertMegumiPattern = (value: string | null): MegumiPattern => {
	if (typeof value === 'string') {
		const pattern = Object.values(MegumiPattern).find(p => p === value);
		return pattern || MegumiPattern.balanced;
	}
	return MegumiPattern.unknown;
};

const parseFriendsStatus = (data: RawFriendsCSV): FriendsStatus => {
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
			convertToNumberElseNull(data['Lv最大まもり'])
		),
		status90: parseBasicStatus(
			data['Lv90けもステ'],
			convertToNumberElseNull(data['Lv90たいりょく']),
			convertToNumberElseNull(data['Lv90こうげき']),
			convertToNumberElseNull(data['Lv90まもり'])
		),
		status99: parseBasicStatus(
			data['Lv99けもステ'],
			convertToNumberElseNull(data['Lv99たいりょく']),
			convertToNumberElseNull(data['Lv99こうげき']),
			convertToNumberElseNull(data['Lv99まもり'])
		),
		status90Yasei5: parseBasicStatus(
			data['Lv90野生5けもステ'],
			convertToNumberElseNull(data['Lv90野生5たいりょく']),
			convertToNumberElseNull(data['Lv90野生5こうげき']),
			convertToNumberElseNull(data['Lv90野生5まもり'])
		),
		status99Yasei5: parseBasicStatus(
			data['Lv99野生5けもステ'],
			convertToNumberElseNull(data['Lv99野生5たいりょく']),
			convertToNumberElseNull(data['Lv99野生5こうげき']),
			convertToNumberElseNull(data['Lv99野生5まもり'])
		),
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
                resolve(parsedData);
            },
        });
    });
}