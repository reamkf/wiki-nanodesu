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