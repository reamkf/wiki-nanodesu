import { BasicStatus } from "./friendsOrPhoto";

export enum PhotoAttribute {
	blue = "青",
	footprint = '足跡',
	none = 'none',
}

export const photoAttributeColor = {
	[PhotoAttribute.footprint]: 'red',
	[PhotoAttribute.blue]: 'blue',
	[PhotoAttribute.none]: 'gray',
}

export const photoAttributeIconUrl = {
	[PhotoAttribute.footprint]: '/wiki-nanodesu/attribute-icons/photo/footprint.png',
	[PhotoAttribute.blue]: '/wiki-nanodesu/attribute-icons/photo/blue.png',
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
	[key: string]: unknown;
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