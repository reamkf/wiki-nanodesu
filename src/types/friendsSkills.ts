export type SkillEffect = {
	effectType: string;        // 効果種別
	friendsId: string;         // フレンズID
	skillType: string;         // わざ種別
	power: string;             // 威力
	target: string;            // 対象
	condition: string;         // 条件
	effectTurn: string;        // 効果ターン
	activationRate: string;    // 発動率
	activationCount: string;   // 発動回数
	note: string;              // 備考
}

export const RAW_SKILL_CSV_HEADERS = [
	'効果種別',
	'フレンズID',
	'わざ種別',
	'威力',
	'対象',
	'条件',
	'効果ターン',
	'発動率',
	'発動回数',
	'備考'
] as const;

export type RawSkillCSV = {
	[key in typeof RAW_SKILL_CSV_HEADERS[number]]: string | number | null;
}