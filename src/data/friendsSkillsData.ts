import { SkillEffect, RawSkillCSV, RAW_SKILL_CSV_HEADERS, SkillWithFriend } from "@/types/friendsSkills";
import { getFriendsData } from "@/data/friendsData";
import { FriendsDataRow } from "@/types/friends";
import { readCsv } from "../utils/readCsv";

// キャッシュ用の変数
let skillsDataCache: SkillEffect[] | null = null;
let skillsWithFriendsCache: SkillWithFriend[] | null = null;
let effectTypesCache: string[] | null = null;

/**
 * スキル別フレンズ一覧のCSVデータを取得する
 */
export async function getSkillsData(): Promise<SkillEffect[]> {
	// キャッシュがあればそれを返す
	if (skillsDataCache) {
		return skillsDataCache;
	}

	return readCsv<RawSkillCSV, SkillEffect>(
		'スキル別フレンズ一覧.csv',
		{
			transformHeader: (header: string, index?: number) => {
				if (RAW_SKILL_CSV_HEADERS.includes(header as typeof RAW_SKILL_CSV_HEADERS[number])) {
					return header;
				}
				console.warn(`Unknown header at index ${index}: ${header}`);
				return `__ignored_${index !== undefined ? index : 'unknown'}`;
			}
		},
		async (data: RawSkillCSV[]) => {
			const parsedData = data.map((row) => {
				return {
					effectType: String(row['効果種別'] || ''),
					friendsId: String(row['フレンズID'] || ''),
					skillType: String(row['わざ種別'] || ''),
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
				item.effectType && item.effectType.trim() !== '' &&
				(item.friendsId || item.skillType)
			) as SkillEffect[];

			skillsDataCache = validData;
			return validData;
		}
	);
}

/**
 * スキルデータとフレンズデータを結合したデータを取得する
 */
export async function getSkillsWithFriendsData(): Promise<SkillWithFriend[]> {
	// キャッシュがあればそれを返す
	if (skillsWithFriendsCache) {
		return skillsWithFriendsCache;
	}

	try {
		const skillsData = await getSkillsData();
		const friendsData = await getFriendsData();

		// フレンズIDの重複を防ぐためにMapを使用
		const friendsIdMap = new Map<string, FriendsDataRow | undefined>();

		// まず一意のフレンズIDのリストを作成
		const uniqueFriendsIds = Array.from(new Set(
			skillsData
				.filter(skill => skill.friendsId && skill.friendsId.trim() !== '')
				.map(skill => skill.friendsId)
		));

		// 一意のフレンズIDに対してフレンズデータを取得
		await Promise.all(
			uniqueFriendsIds.map(async (friendsId) => {
				if (!friendsId) return;
				try {
					const friend = friendsData.find(friend => friend.id === friendsId);
					friendsIdMap.set(friendsId, friend || undefined);
				} catch (error) {
					console.error(`Error fetching friend data for ${friendsId}:`, error);
					friendsIdMap.set(friendsId, undefined);
				}
			})
		);

		// スキルデータとフレンズデータを結合
		const enrichedData = skillsData.map(skill => {
			const friendsDataRow = friendsIdMap.get(skill.friendsId);
			return { ...skill, friendsDataRow: friendsDataRow };
		}).filter((item): item is SkillWithFriend =>
			item.friendsDataRow !== undefined
		);

		// friendsDataRow.listIndexの降順でソート
		const sortedData = [...enrichedData].sort((a, b) => {
			const indexA = a.friendsDataRow?.listIndex ?? 0;
			const indexB = b.friendsDataRow?.listIndex ?? 0;
			return indexB - indexA; // 降順ソート
		});

		// キャッシュを更新
		skillsWithFriendsCache = sortedData;

		return sortedData;
	} catch (error) {
		console.error("Error in getSkillsWithFriendsData:", error);
		return [];
	}
}

/**
 * 効果種別でフィルタリングしたスキルデータとフレンズデータを取得
 * @param effectType 効果種別
 */
export async function getSkillsWithFriendsByEffectType(effectType: string): Promise<SkillWithFriend[]> {
	const skillsWithFriends = await getSkillsWithFriendsData();
	return skillsWithFriends.filter(skill => skill.effectType === effectType);
}

/**
 * 効果種別でフィルタリングしたスキルデータを取得する
 * @param effectType 効果種別
 */
export async function getSkillsByEffectType(effectType: string): Promise<SkillEffect[]> {
	const skillsData = await getSkillsData();
	return skillsData.filter(skill => skill.effectType === effectType);
}

/**
 * 特定のフレンズIDのスキルデータを取得する
 * @param friendsId フレンズID
 */
export async function getSkillsByFriendsId(friendsId: string): Promise<SkillEffect[]> {
	const skillsData = await getSkillsData();
	return skillsData.filter(skill => skill.friendsId === friendsId);
}

/**
 * 効果種別の一覧を取得する
 */
export async function getEffectTypes(): Promise<string[]> {
	// キャッシュがあればそれを返す
	if (effectTypesCache) {
		return effectTypesCache;
	}

	try {
		const skillsData = await getSkillsData();
		const effectTypes = new Set<string>();

		skillsData.forEach(skill => {
			if (skill.effectType && skill.effectType.trim() !== '') {
				effectTypes.add(skill.effectType);
			}
		});

		const result = Array.from(effectTypes).sort();

		// キャッシュを更新
		effectTypesCache = result;

		return result;
	} catch (error) {
		console.error("Error in getEffectTypes:", error);
		return [];
	}
}