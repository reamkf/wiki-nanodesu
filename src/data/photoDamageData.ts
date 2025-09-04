import { PhotoDamageDataRow, RawPhotoDamageCSV, RAW_PHOTO_DAMAGE_CSV_HEADERS } from "@/types/photo";
import { readCsv } from '../utils/readCsv';
import { parseNumericValue } from '@/utils/common';


let photoDamageDataCache: PhotoDamageDataRow[] | null = null;

export async function getPhotoDamageData(): Promise<PhotoDamageDataRow[]> {
	if (photoDamageDataCache) {
		return photoDamageDataCache;
	}

	return readCsv<RawPhotoDamageCSV, PhotoDamageDataRow>(
		'フォト火力データ.csv',
		{
			transformHeader: (header: string) => {
				return RAW_PHOTO_DAMAGE_CSV_HEADERS.includes(header as typeof RAW_PHOTO_DAMAGE_CSV_HEADERS[number]) ? header : '';
			}
		},
		async (data: RawPhotoDamageCSV[]) => {
			const parsedData = data.map((row) => {
				return {
					photoId: row.フォトID || '',
					changeState: (row['変化前・後'] as '変化前' | '変化後') || '変化前',
					condition: row.条件 === '-' ? '' : (row.条件 || ''),
					damageMultiplier: parseNumericValue(row.与ダメ増加) || 1.0,
				};
			});
			photoDamageDataCache = parsedData;
			return photoDamageDataCache;
		}
	);
}

export async function getPhotoDamageDataByPhotoId(photoId: string): Promise<PhotoDamageDataRow[]> {
	const photoDamageData = await getPhotoDamageData();
	return photoDamageData.filter(data => data.photoId === photoId);
}

export async function getPhotoDamageDataByPhotoIdAndState(
	photoId: string,
	changeState: '変化前' | '変化後'
): Promise<PhotoDamageDataRow[]> {
	const photoDamageData = await getPhotoDamageData();
	return photoDamageData.filter(data =>
		data.photoId === photoId && data.changeState === changeState
	);
}