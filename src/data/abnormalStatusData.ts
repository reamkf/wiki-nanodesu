import { AbnormalStatusEffect, RawAbnormalStatusCSV, RAW_ABNORMAL_STATUS_CSV_HEADERS, AbnormalStatusWithFriend, AbnormalStatusType } from "@/types/abnormalStatus";
import { getFriendsData } from "@/data/friendsData";
import { getPhotoData } from "@/data/photoData";
import { FriendsDataRow } from "@/types/friends";
import { PhotoDataRow } from "@/types/photo";
import { readCsv } from "../utils/readCsv";

// キャッシュ用の変数
let abnormalStatusDataCache: AbnormalStatusEffect[] | null = null;
let abnormalStatusWithFriendsCache: AbnormalStatusWithFriend[] | null = null;
let abnormalStatusTypesCache: string[] | null = null;

/**
 * 状態異常データのCSVデータを取得する
 */
export async function getAbnormalStatusData(): Promise<AbnormalStatusEffect[]> {
	// キャッシュがあればそれを返す
	if (abnormalStatusDataCache) {
		return abnormalStatusDataCache;
	}

	return readCsv<RawAbnormalStatusCSV, AbnormalStatusEffect>(
		'状態異常スキル一覧.csv',
		{
			transformHeader: (header: string, index?: number) => {
				if (RAW_ABNORMAL_STATUS_CSV_HEADERS.includes(header as typeof RAW_ABNORMAL_STATUS_CSV_HEADERS[number])) {
					return header;
				}
				console.warn(`Unknown header at index ${index}: ${header}`);
				return `__ignored_${index !== undefined ? index : 'unknown'}`;
			}
		},
		async (data: RawAbnormalStatusCSV[]) => {
			const parsedData = data.map((row) => {
				return {
					friendsIdOrPhotoName: String(row['フレンズID/フォト名'] || ''),
					skillType: String(row['わざ種別'] || ''),
					abnormalStatus: String(row['状態異常'] || ''),
					effectType: String(row['効果種別'] || ''),
					power: String(row['威力'] || ''),
					target: String(row['対象'] || ''),
					condition: String(row['条件'] || ''),
					effectTurn: String(row['効果ターン'] || ''),
					activationRate: String(row['発動率'] || ''),
					activationCount: String(row['発動回数'] || ''),
					note: String(row['備考'] || '')
				};
			});

			const validData = parsedData.filter(item =>
				item.friendsIdOrPhotoName && item.friendsIdOrPhotoName.trim() !== '' &&
				item.abnormalStatus && item.abnormalStatus.trim() !== ''
			) as AbnormalStatusEffect[];

			abnormalStatusDataCache = validData;
			return validData;
		}
	);
}

/**
 * 状態異常の種類のリストを取得する
 */
export async function getAbnormalStatusTypes(): Promise<AbnormalStatusType[]> {
	// キャッシュがあればそれを返す
	if (abnormalStatusTypesCache) {
		return abnormalStatusTypesCache;
	}

	const abnormalStatusData = await getAbnormalStatusData();

	// 状態異常の種類を重複なしで取得
	const types = Array.from(new Set(
		abnormalStatusData
			.filter(status => status.abnormalStatus && status.abnormalStatus.trim() !== '')
			.map(status => status.abnormalStatus)
	)).sort();

	// キャッシュを更新
	abnormalStatusTypesCache = types;

	return types;
}

/**
 * 状態異常データとフレンズ/フォトデータを結合したデータを取得する
 */
export async function getAbnormalStatusWithFriendsAndPhotos(): Promise<AbnormalStatusWithFriend[]> {
	// キャッシュがあればそれを返す
	if (abnormalStatusWithFriendsCache) {
		return abnormalStatusWithFriendsCache;
	}

	try {
		const [abnormalStatusData, friendsData, photoData] = await Promise.all([
			getAbnormalStatusData(),
			getFriendsData(),
			getPhotoData()
		]);

		// フレンズID/フォト名のマッピングを作成
		const friendsIdMap = new Map<string, FriendsDataRow | undefined>();
		const photoNameMap = new Map<string, PhotoDataRow | undefined>();

		// まず一意のID/名前リストを作成
		const uniqueIdentifiers = Array.from(new Set(
			abnormalStatusData
				.filter(status => status.friendsIdOrPhotoName && status.friendsIdOrPhotoName.trim() !== '')
				.map(status => status.friendsIdOrPhotoName)
		));

		// フレンズデータとフォトデータを取得
		uniqueIdentifiers.forEach((identifier) => {
			if (!identifier) return;

			// フレンズIDとして検索
			const friend = friendsData.find(friend => friend.id === identifier);
			if (friend) {
				friendsIdMap.set(identifier, friend);
				return;
			}

			// フォト名として検索
			const photo = photoData.find(photo => photo.name === identifier);
			if (photo) {
				photoNameMap.set(identifier, photo);
			}
		});

		// 状態異常データとフレンズ/フォトデータを結合
		const enrichedData = abnormalStatusData.map(status => {
			const identifier = status.friendsIdOrPhotoName;
			const friendsDataRow = friendsIdMap.get(identifier);
			const photoDataRow = photoNameMap.get(identifier);
			const isPhoto = !friendsDataRow && !!photoDataRow || identifier.includes('フォト') || false;

			return {
				...status,
				friendsDataRow,
				photoDataRow,
				isPhoto: isPhoto
			};
		});

		// フレンズとフォトでソート
		const sortedData = [...enrichedData].sort((a, b) => {
			// まずフレンズを先にし、フォトを後ろにする
			if (a.isPhoto !== b.isPhoto) {
				return a.isPhoto ? 1 : -1;
			}

			// フレンズ同士の場合はlistIndexの降順でソート
			if (!a.isPhoto && !b.isPhoto) {
				const indexA = a.friendsDataRow?.listIndex ?? 0;
				const indexB = b.friendsDataRow?.listIndex ?? 0;
				return indexB - indexA; // 降順ソート
			}

			// フォト同士の場合は名前順でソート
			return a.friendsIdOrPhotoName.localeCompare(b.friendsIdOrPhotoName);
		});

		// キャッシュを更新
		abnormalStatusWithFriendsCache = sortedData;

		return sortedData;
	} catch (error) {
		console.error("Error in getAbnormalStatusWithFriendsAndPhotos:", error);
		return [];
	}
}