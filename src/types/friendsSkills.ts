export type FriendsSkillType = 'けものミラクル' | 'とくいわざ' | 'たいきスキル' | 'とくせい' | 'キセキとくせい' | 'なないろとくせい';

export type EffectType =
	'与ダメージ増加' |
	'Beat!!!与ダメージ増加' |
	'Action!与ダメージ増加' |
	'Try!!与ダメージ増加' |
	'被ダメージ減少' |
	'全体攻撃による被ダメージ減少' |
	'攻撃命中率増加' |
	'かいひ増加' |
	'与ダメージ減少' |
	'被ダメージ増加' |
	'全体攻撃による被ダメージ増加' |
	'攻撃命中率減少' |
	'かいひ減少' |
	'回復' |
	'毎ターン回復' |
	'吸収' |
	'毎ターン回復解除' |
	'たいりょく回復量増加' |
	'たいりょく回復量減少' |
	'たいりょく回復量減少状態解除' |
	'MP増加' |
	'毎ターンMP増加' |
	'MP減少' |
	'毎ターンMP減少状態解除' |
	'MP増加量減少状態解除' |
	'与ダメージ増加状態解除' |
	'被ダメージ減少状態解除' |
	'攻撃命中率増加状態解除' |
	'かいひ増加状態解除' |
	'与ダメージ減少状態解除' |
	'被ダメージ増加状態解除' |
	'攻撃命中率減少状態解除' |
	'かいひ減少状態解除' |
	'プラズムチャージ効果回数追加' |
	'全体Beat' |
	'均等割ダメージ' |
	'コーラス参加' |
	'おかわり増加' |
	'おかわり最大値増加' |
	'たいりょく1で耐える' |
	'ギブアップ復帰';

export type SkillEffect = {
	effectType: EffectType;    // 効果種別
	friendsId: string;         // フレンズID
	skillType: FriendsSkillType;      // わざ種別
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

import { FriendsDataRow } from "@/types/friends";

// スキルとフレンズデータを含む結合型
export type SkillWithFriend = SkillEffect & {
	friendsDataRow: FriendsDataRow
}
