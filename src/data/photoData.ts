import { PhotoDataRow, PhotoAttribute, PhotoStatus, RawPhotoCSV, RAW_PHOTO_CSV_HEADERS } from "@/types/photo";
import { BasicStatus } from "@/types/friendsOrPhoto";
import { getFriendsData } from "@/data/friendsData";
import { readCsv } from '../utils/readCsv';
import { parseNumericValue } from '@/utils/common';

/**
 * ベースステータスをパースする
 * @param hp たいりょく
 * @param atk こうげき
 * @param def まもり
 */
function parseBasicStatus (
	hp: number | null,
	atk: number | null,
	def: number | null,
	estimated: boolean = true
): BasicStatus {
	return {
		kemosute: null,
		hp: parseNumericValue(hp),
		def: parseNumericValue(def),
		atk: parseNumericValue(atk),
		estimated: estimated
	};
}

export function parsePhotoStatus(data: RawPhotoCSV): PhotoStatus {
	return {
		status1: parseBasicStatus(
			parseNumericValue(data['Lv.1たいりょく']),
			parseNumericValue(data['Lv.1こうげき']),
			parseNumericValue(data['Lv.1まもり']),
			false
		),
		statusMedium: parseBasicStatus(
			parseNumericValue(data['変化前たいりょく']),
			parseNumericValue(data['変化前こうげき']),
			parseNumericValue(data['変化前まもり']),
			false
		),
		statusMax: parseBasicStatus(
			parseNumericValue(data['変化後たいりょく']),
			parseNumericValue(data['変化後こうげき']),
			parseNumericValue(data['変化後まもり']),
			false
		)
	};
}

let photoDataCache: PhotoDataRow[] | null = null;

export async function getPhotoData(): Promise<PhotoDataRow[]> {
	if (photoDataCache) {
		return photoDataCache;
	}

	const friendsData = await getFriendsData();
	const wildPhotoData = friendsData.filter(friend => !friend.isHc).map(friend => ({
		name: (friend.secondName !== '' ? `【${friend.secondName}】` : '') + friend.name + '(フォト)',
		implementType: friend.implementType,
		implementDate: friend.implementDate,
		rarity: 3,
		attribute: friend.wildPhotoAttribute as PhotoAttribute || PhotoAttribute.none,
		illustratorName: '',
		iconUrl: '',
		iconUrlChanged: '',
		trait: friend.wildPhotoTrait || '',
		traitChanged: friend.wildPhotoTraitChanged || '',
		status: {
			status1: parseBasicStatus(null, null, null, true),
			statusMedium: parseBasicStatus(null, null, null, true),
			statusMax: parseBasicStatus(null, null, null, true),
		},
		isWildPhoto: true,
	} as PhotoDataRow));

	return readCsv<RawPhotoCSV, PhotoDataRow>(
		'フォトデータ.csv',
		{
			transformHeader: (header: string) => {
				return RAW_PHOTO_CSV_HEADERS.includes(header as typeof RAW_PHOTO_CSV_HEADERS[number]) ? header : '';
			}
		},
		async (data: RawPhotoCSV[]) => {
			const parsedData = data.map((row) => {
				return {
					name: row.フォト名 || '',
					rarity: row.レア度 || 0,
					attribute: (row.属性 as PhotoAttribute) || PhotoAttribute.none,
					implementType: row.入手 || '',
					implementDate: row.実装日 || '',
					illustratorName: row.イラストレーター名 || '',
					iconUrl: row.変化前アイコンURL || '',
					iconUrlChanged: row.変化後アイコンURL || '',
					trait: row['とくせい(変化前)'] || '',
					traitChanged: row['とくせい(変化後)'] || '',
					status: parsePhotoStatus(row),
					isWildPhoto: false,
				};
			});
			photoDataCache = [...parsedData, ...wildPhotoData];
			return photoDataCache;
		}
	);
}

export async function getPhotoDataByName(name: string): Promise<PhotoDataRow | null> {
	const photoData = await getPhotoData();
	return photoData.find(photo => photo.name === name) || null;
}