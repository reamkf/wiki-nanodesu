import { GetStaticProps } from 'next'
import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { FriendsDataRow, FriendsAttribute, MegumiPattern, FriendsStatus, RawFriendsCSV } from "@/types/friends";
import type { BasicStatus } from "@/types/common";

// RawFriendsCSVのキーを定義
const CSV_HEADERS = [
	'ID',
	'フレンズ名',
	'属性違い二つ名',
	'属性',
	'実装日',
	'実装種別',
	'実装種別詳細',
	'一覧順',
	'アイコンURL',
	'初期けも級',
	'野生大解放',
	'12ポケ',
	'特別衣装数',
	'CV',
	'かいひ',
	'かいひ野生5',
	'ぷらずむ',
	'Beatフラッグ',
	'Actionフラッグ',
	'Tryフラッグ',
	'Beat補正',
	'Action補正',
	'Try補正',
	'Beat補正野生5',
	'Action補正野生5',
	'Try補正野生5',
	'Lv最大けもステ',
	'Lv最大たいりょく',
	'Lv最大こうげき',
	'Lv最大まもり',
	'Lv90けもステ',
	'Lv90たいりょく',
	'Lv90こうげき',
	'Lv90まもり',
	'Lv99けもステ',
	'Lv99たいりょく',
	'Lv99こうげき',
	'Lv99まもり',
	'Lv90野生5けもステ',
	'Lv90野生5たいりょく',
	'Lv90野生5こうげき',
	'Lv90野生5まもり',
	'Lv99野生5けもステ',
	'Lv99野生5たいりょく',
	'Lv99野生5こうげき',
	'Lv99野生5まもり',
	'☆1Lv1たいりょく',
	'☆1Lv1こうげき',
	'☆1Lv1まもり',
	'☆1Lv90たいりょく',
	'☆1Lv90こうげき',
	'☆1Lv90まもり',
	'☆1Lv99たいりょく',
	'☆1Lv99こうげき',
	'☆1Lv99まもり',
	'☆1野生解放1-4合計たいりょく',
	'☆1野生解放1-4合計こうげき',
	'☆1野生解放1-4合計まもり',
	'☆1野生解放1-5合計たいりょく',
	'☆1野生解放1-5合計こうげき',
	'☆1野生解放1-5合計まもり',
	'Lv100+上昇パターン'
] as const;

const parseBasicStatus = (
	kemosute: number,
	hp: number,
	atk: number,
	def: number
): BasicStatus => ({
	kemosute: kemosute || -1,
	hp: hp || -1,
	def: def || -1,
	atk: atk || -1
});

const convertToMegumiPattern = (value: string | null): MegumiPattern => {
	if (typeof value === 'string') {
		const pattern = Object.values(MegumiPattern).find(p => p === value);
		return pattern || MegumiPattern.balanced;
	}
	return MegumiPattern.unknown;
};

const parseFriendsStatus = (data: RawFriendsCSV): FriendsStatus => {
	return {
		avoid: data.かいひ || -1,
		avoidYasei5: data.かいひ野生5 || -1,
		plasm: data.ぷらずむ || -1,
		beatFlags: data.Beatフラッグ || -1,
		actionFlags: (typeof data.Actionフラッグ === 'string' ? data.Actionフラッグ.split(',') : [data.Actionフラッグ || 0]).map(Number),
		tryFlags: (typeof data.Tryフラッグ === 'string' ? data.Tryフラッグ.split(',') : [data.Tryフラッグ || 0]).map(Number),
		flagDamageUp: {
			beat: data.Beat補正 || -1,
			action: data.Action補正 || -1,
			try: data.Try補正 || -1
		},
		flagDamageUpYasei5: {
			beat: data.Beat補正野生5 || -1,
			action: data.Action補正野生5 || -1,
			try: data.Try補正野生5 || -1
		},
		statusInitial: parseBasicStatus(
			data['Lv最大けもステ'],
			data['Lv最大たいりょく'],
			data['Lv最大こうげき'],
			data['Lv最大まもり']
		),
		status90: parseBasicStatus(
			data['Lv90けもステ'],
			data['Lv90たいりょく'],
			data['Lv90こうげき'],
			data['Lv90まもり']
		),
		status99: parseBasicStatus(
			data['Lv99けもステ'],
			data['Lv99たいりょく'],
			data['Lv99こうげき'],
			data['Lv99まもり']
		),
		status90Yasei5: parseBasicStatus(
			data['Lv90野生5けもステ'],
			data['Lv90野生5たいりょく'],
			data['Lv90野生5こうげき'],
			data['Lv90野生5まもり']
		),
		status99Yasei5: parseBasicStatus(
			data['Lv99野生5けもステ'],
			data['Lv99野生5たいりょく'],
			data['Lv99野生5こうげき'],
			data['Lv99野生5まもり']
		),
		statusBase: {
			lv1: parseBasicStatus(
				0,
				data['☆1Lv1たいりょく'],
				data['☆1Lv1こうげき'],
				data['☆1Lv1まもり']
			),
			lv90: parseBasicStatus(
				0,
				data['Lv90たいりょく'],
				data['Lv90こうげき'],
				data['Lv90まもり']
			),
			lv99: parseBasicStatus(
				0,
				data['Lv99たいりょく'],
				data['Lv99こうげき'],
				data['Lv99まもり']
			),
			yasei4: parseBasicStatus(
				-1,
				data['☆1野生解放1-4合計たいりょく'],
				data['☆1野生解放1-4合計こうげき'],
				data['☆1野生解放1-4合計まもり'],
			),
			yasei5: parseBasicStatus(
				-1,
				data['☆1野生解放1-5合計たいりょく'],
				data['☆1野生解放1-5合計こうげき'],
				data['☆1野生解放1-5合計まもり']
			),
			megumiPattern: convertToMegumiPattern(data['Lv100+上昇パターン'])
		}
	};
};

export const getFriendsData: GetStaticProps<{ friends: FriendsDataRow[] }> = async () => {
	const csvPath = join(process.cwd(), "csv", "フレンズデータ.csv");
	const csvFile = readFileSync(csvPath, "utf-8");

	const data = await new Promise<FriendsDataRow[]>((resolve) => {
		Papa.parse(csvFile, {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			transformHeader: (header: string) => {
				// 不要なヘッダーは空文字列に変換して無視
				return CSV_HEADERS.includes(header as typeof CSV_HEADERS[number]) ? header : '';
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

	console.log("FriendsData");
	console.log(data[0]);
	console.log(data[1]);

	return {
		props: {
			friends: data
		},
	};
};
