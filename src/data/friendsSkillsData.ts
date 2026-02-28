import { SkillEffect, RawSkillCSV, RAW_SKILL_CSV_HEADERS, SkillWithFriend } from "@/types/friendsSkills";
import { getFriendsDataMap } from "@/data/friendsData";
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
			const validData: SkillEffect[] = [];
			for (const row of data) {
				const effectType = String(row['効果種別'] || '');
				const friendsId = String(row['フレンズID'] || '');
				const skillType = String(row['わざ種別'] || '');
				if (!effectType || effectType.trim() === '' || (!friendsId && !skillType)) continue;

				validData.push({
					effectType,
					friendsId,
					skillType,
					power: String(row['威力'] || ''),
					target: String(row['対象'] || ''),
					condition: String(row['条件'] || ''),
					effectTurn: String(row['効果ターン'] || ''),
					activationRate: String(row['発動率'] || ''),
					activationCount: String(row['発動回数'] || ''),
					note: String(row['備考'] || '')
				} as SkillEffect);
			}

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
		const [skillsData, friendsDataMap] = await Promise.all([
			getSkillsData(),
			getFriendsDataMap()
		]);

		// スキルデータとフレンズデータを結合
		const enrichedData = skillsData.map(skill => {
			const friendsDataRow = friendsDataMap.get(skill.friendsId);
			return { ...skill, friendsDataRow };
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