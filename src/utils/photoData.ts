import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { PhotoDataRow, PhotoAttribute, PhotoStatus, RawPhotoCSV, RAW_PHOTO_CSV_HEADERS } from "@/types/photo";
import { BasicStatus } from "@/types/friendsOrPhoto";
import { getFriendsData } from "@/utils/friends/friendsData";

function convertToNumberElseNull(value: unknown): number | null {
	if (typeof value === 'number') return value;
	if (typeof value === 'string') return parseInt(value);
	return null;
}

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
		hp: convertToNumberElseNull(hp),
		def: convertToNumberElseNull(def),
		atk: convertToNumberElseNull(atk),
		estimated: estimated
	};
}

export async function parsePhotoStatus(data: RawPhotoCSV): Promise<PhotoStatus> {
	return {
		status1: parseBasicStatus(
			convertToNumberElseNull(data['Lv.1たいりょく']),
			convertToNumberElseNull(data['Lv.1こうげき']),
			convertToNumberElseNull(data['Lv.1まもり']),
			false
		),
		statusMedium: parseBasicStatus(
			convertToNumberElseNull(data['変化前たいりょく']),
			convertToNumberElseNull(data['変化前こうげき']),
			convertToNumberElseNull(data['変化前まもり']),
			false
		),
		statusMax: parseBasicStatus(
			convertToNumberElseNull(data['変化後たいりょく']),
			convertToNumberElseNull(data['変化後こうげき']),
			convertToNumberElseNull(data['変化後まもり']),
			false
		)
	};
}

export async function getPhotoData(): Promise<PhotoDataRow[]> {
    const csvPath = join(process.cwd(), "csv", "フォトデータ.csv");
    const csvFile = readFileSync(csvPath, "utf-8");

	const friendsData = await getFriendsData();
	const wildPhotoData = friendsData.filter(friend => !friend.isHc).map(friend => ({
		name: (friend.secondName !== '' ? `【${friend.secondName}】` : '') + friend.name + '(フォト)',
		implementType: friend.implementType,
		implementDate: friend.implementDate,
		rarity: 3,
		attribute: friend.wildPhotoAttribute as PhotoAttribute || PhotoAttribute.none,
		trait: friend.wildPhotoTrait,
		traitChanged: friend.wildPhotoTraitChanged,
		isWildPhoto: true,
	} as unknown as PhotoDataRow))

    return new Promise<PhotoDataRow[]>(async (resolve) => {
        Papa.parse(csvFile, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => {
                return RAW_PHOTO_CSV_HEADERS.includes(header as typeof RAW_PHOTO_CSV_HEADERS[number]) ? header : '';
            },
            complete: async (results) => {
                const parsedData = await Promise.all((results.data as RawPhotoCSV[]).map(async (row) => {
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
						status: await parsePhotoStatus(row),
						isWildPhoto: false,
					};
                }));
				resolve([...parsedData, ...wildPhotoData]);
            },
        });
    });
}

export async function getPhotoDataByName(name: string): Promise<PhotoDataRow | null> {
	const photoData = await getPhotoData();
	return photoData.find(photo => photo.name === name) || null;
}