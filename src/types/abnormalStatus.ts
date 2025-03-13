import { FriendsSkillType } from "./friendsSkills";
type FriendsOrPhotoSkillType = FriendsSkillType | 'とくせい(変化前)' | 'とくせい(変化後)';

export enum AbnormalStatusSkillEffectType {
	give = '付与',
	incleaseResist = '耐性増加',
	decreaseResist = '耐性減少',
	remove = '解除',
}

export type AbnormalStatusEffect = {
	friendsIdOrPhotoName: string;  // フレンズID/フォト名
	skillType: FriendsOrPhotoSkillType;        // わざ種別
	abnormalStatus: string;      // 状態異常
	effectType: AbnormalStatusSkillEffectType;      // 効果種別
	power: string;               // 威力
	target: string;              // 対象
	condition: string;           // 条件
	effectTurn: string;          // 効果ターン
	activationRate: string;      // 発動率
	activationCount: string;     // 発動回数
	note: string;                // 備考
}

export const RAW_ABNORMAL_STATUS_CSV_HEADERS = [
	'フレンズID/フォト名',
	'わざ種別',
	'状態異常',
	'効果種別',
	'威力',
	'対象',
	'条件',
	'効果ターン',
	'発動率',
	'発動回数',
	'備考'
] as const;

export type RawAbnormalStatusCSV = {
	[key in typeof RAW_ABNORMAL_STATUS_CSV_HEADERS[number]]: string | number | null;
}

import { FriendsDataRow } from "@/types/friends";
import { PhotoDataRow } from "@/types/photo";

// 状態異常とフレンズデータを含む結合型
export type AbnormalStatusWithFriend = AbnormalStatusEffect & {
	friendsDataRow?: FriendsDataRow;
	photoDataRow?: PhotoDataRow;
	isPhoto: boolean;
}

// 状態異常の種類リスト
export type AbnormalStatusType = string;

// ソート順定義
// 威力のソート優先度マップ
export const POWER_PRIORITY_MAP: Record<string, number> = {
	'完全耐性': 1000,
	'大幅に': 500,
	'-': 100,
	'高': 90,
	'大': 85,
	'中': 50,
	'低': 30,
	'少し': 30,
	'少しだけ': 25,
	'ほんの少し': 20,
	'小': 20
};

// 威力の優先度を取得する関数
export function getPowerPriority(power: string): number {
	if (!power) return -1;
	return POWER_PRIORITY_MAP[power] || 0;
}

// 発動率のソート優先度マップ
export const ACTIVATION_RATE_PRIORITY_MAP: Record<string, number> = {
	'-': 100,
	'高確率': 90,
	'中確率': 50,
	'低確率': 30
};

// 発動率の優先度を取得する関数
export function getActivationRatePriority(activationRate: string): number {
	if (!activationRate) return -1;

	// 数値+%の形式（例：100%、75%など）をチェック
	const percentMatch = activationRate.match(/^(\d+)%$/);
	if (percentMatch) {
		// 数値を抽出して、100を基準にソート（大きいほど優先度が高い）
		return 100 + parseInt(percentMatch[1], 10);
	}

	return ACTIVATION_RATE_PRIORITY_MAP[activationRate] || 0;
}

// スキルタイプの優先度を取得する関数
export function getSkillTypePriority(skillType: string): number {
	if (!skillType) return -1;

	if (skillType === 'とくせい' || skillType === 'キセキとくせい' || skillType === 'なないろとくせい') return 1;

	return 0;
}

// 対象の優先度を取得する関数
export function getTargetPriority(target: string): number {
	if (!target) return -1;

	if (target.includes('味方全体')) return 3;
	if (target.includes('自身を除く') && target.includes('味方全体')) return 2;
	if (target.includes('自身')) return 1;

	return 0;
}