import { BasicStatus } from "./status";

export enum PhotoAttribute {
	blue = "青",
	footprint = '足跡',
	none = 'none',
}

export const photoAttributeOrder = {
	[PhotoAttribute.footprint]: 0,
	[PhotoAttribute.blue]: 1,
	[PhotoAttribute.none]: 2,
}

export const photoAttributeColor = {
	[PhotoAttribute.footprint]: 'red',
	[PhotoAttribute.blue]: 'blue',
	[PhotoAttribute.none]: 'gray',
}

export const photoAttributeIconUrl = {
	[PhotoAttribute.footprint]: 'https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/qgiGkSmtiA.png',
	[PhotoAttribute.blue]: 'https://image02.seesaawiki.jp/k/h/kemono_friends3_5ch/PrbmdBx8J4.png',
}

export interface PhotoStatus {
	status1: BasicStatus;
	statusMedium: BasicStatus;
	statusMax: BasicStatus;
}

export interface PhotoDataRow {
	name: string;
	rarity: number;
	attribute: PhotoAttribute;
	implementType: string;
	implementDate: string;
	illustratorName: string;
	iconUrl: string;
	iconUrlChanged: string;
	trait: string;
	traitChanged: string;
	status: PhotoStatus;
	isWildPhoto: boolean;
}

export interface RawPhotoCSV {
	レア度: number;
	フォト名: string;
	属性: string;
	入手: string;
	実装日: string;
	ページURL: string;
	イラストレーター名: string;
	変化前アイコンURL: string;
	変化後アイコンURL: string;
	'とくせい(変化前)': string;
	'とくせい(変化後)': string;
	'Lv.1たいりょく': number;
	'Lv.1こうげき': number;
	'Lv.1まもり': number;
	変化前たいりょく: number;
	変化前こうげき: number;
	変化前まもり: number;
	変化後たいりょく: number;
	変化後こうげき: number;
	変化後まもり: number;
}

export const RAW_PHOTO_CSV_HEADERS = [
	'レア度',
	'フォト名',
	'属性',
	'入手',
	'実装日',
	'ページURL',
	'イラストレーター名',
	'変化前アイコンURL',
	'変化後アイコンURL',
	'とくせい(変化前)',
	'とくせい(変化後)',
	'Lv.1たいりょく',
	'Lv.1こうげき',
	'Lv.1まもり',
	'変化前たいりょく',
	'変化前こうげき',
	'変化前まもり',
	'変化後たいりょく',
	'変化後こうげき',
	'変化後まもり',
] as const;