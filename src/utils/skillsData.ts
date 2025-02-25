import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { SkillEffect, RawSkillCSV, RAW_SKILL_CSV_HEADERS } from "@/types/skills";

/**
 * スキル別フレンズ一覧のCSVデータを取得する
 */
export async function getSkillsData(): Promise<SkillEffect[]> {
	const csvPath = join(process.cwd(), "csv", "スキル別フレンズ一覧.csv");
	const csvFile = readFileSync(csvPath, "utf-8");

	return new Promise<SkillEffect[]>((resolve) => {
		Papa.parse(csvFile, {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			transformHeader: (header: string) => {
				return RAW_SKILL_CSV_HEADERS.includes(header as typeof RAW_SKILL_CSV_HEADERS[number]) ? header : '';
			},
			complete: (results) => {
				const parsedData = (results.data as RawSkillCSV[]).map((row) => {
					return {
						effectType: row['効果種別']?.toString() || '',
						friendsId: row['フレンズID']?.toString() || '',
						skillType: row['わざ種別']?.toString() || '',
						power: row['威力']?.toString() || '',
						target: row['対象']?.toString() || '',
						condition: row['条件']?.toString() || '',
						effectTurn: row['効果ターン']?.toString() || '',
						activationRate: row['発動率']?.toString() || '',
						activationCount: row['発動回数']?.toString() || '',
						note: row['備考']?.toString() || ''
					};
				});
				resolve(parsedData);
			},
		});
	});
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
	const skillsData = await getSkillsData();
	const effectTypes = new Set<string>();

	skillsData.forEach(skill => {
		if (skill.effectType) {
			effectTypes.add(skill.effectType);
		}
	});

	return Array.from(effectTypes).sort();
}