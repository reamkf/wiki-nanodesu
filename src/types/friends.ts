import { BasicStatus } from "./status";

export enum FriendsAttribute {
	friendry = "フレンドリー",
	funny = "ファニー",
	relax = "リラックス",
	active = "アクティブ",
	lovely = "ラブリー",
	mypace = "マイペース"
}

export const FriendsAttributeOrder = {
	[FriendsAttribute.friendry]: 0,
	[FriendsAttribute.funny]: 1,
	[FriendsAttribute.relax]: 2,
	[FriendsAttribute.active]: 3,
	[FriendsAttribute.lovely]: 4,
	[FriendsAttribute.mypace]: 5,
}

export const friendsAttributeColor = {
	[FriendsAttribute.funny]: 'red',
	[FriendsAttribute.relax]: '#0075c8',
	[FriendsAttribute.friendry]: '#009e25',
	[FriendsAttribute.lovely]: '#ffb3b3',
	[FriendsAttribute.mypace]: '#88abda',
	[FriendsAttribute.active]: '#a6cf00',
}

export const friendsAttributeIconUrl = {
	[FriendsAttribute.funny]: 'https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/vXf03Kpfcp.png',
	[FriendsAttribute.relax]: 'https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/OEyQU1TXsg.png',
	[FriendsAttribute.friendry]: 'https://image02.seesaawiki.jp/k/h/kemono_friends3_5ch/1A7oOIefKg.png',
	[FriendsAttribute.lovely]: 'https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/4NWcmHe3Ol.png',
	[FriendsAttribute.mypace]: 'https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/w4NXdo915I.png',
	[FriendsAttribute.active]: 'https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/sbHG16adu9.png',
}

export enum MegumiPattern {
	atk65 = 'こうげき+65型',
	atk60 = 'こうげき+60型',
	atk50 = 'こうげき+50型',
	atk40 = 'こうげき+40型',
	hp50 = 'たいりょく+50型',
	def50 = 'まもり+50型',
	balanced = 'バランス型',
	atkDef = 'こうげき・まもり増加型',
	unknown = ''
}

export const megumiRaiseStatus = {
	[MegumiPattern.atk65]:    {hp: 10, atk: 65, def: 10},
	[MegumiPattern.atk60]:    {hp:  5, atk: 60, def: 25},
	[MegumiPattern.atk50]:    {hp: 25, atk: 50, def: 10},
	[MegumiPattern.atk40]:    {hp: 35, atk: 40, def: 10},
	[MegumiPattern.hp50]:     {hp: 50, atk: 10, def: 25},
	[MegumiPattern.def50]:    {hp: 25, atk: 10, def: 50},
	[MegumiPattern.atkDef]:   {hp:  0, atk: 45, def: 45},
	[MegumiPattern.balanced]: {hp: 20, atk: 35, def: 35},
	[MegumiPattern.unknown]:  {hp:  0, atk:  0, def:  0},
}

export interface FriendsFlagDamageUp {
	beat: number | null;
	action: number | null;
	try: number | null;
}

export interface FriendsStatusBase {
	lv1: BasicStatus;
	lv90: BasicStatus;
	lv99: BasicStatus;
	yasei4: BasicStatus;
	yasei5: BasicStatus;
	megumiPattern: MegumiPattern;
}

export interface FriendsStatus {
	avoid: number | null;
	avoidYasei5: number | null;

	plasm: number | null;

	beatFlags: number | null;
	actionFlags: number[] | null;
	tryFlags: number[] | null;

	flagDamageUp: FriendsFlagDamageUp;
	flagDamageUpYasei5: FriendsFlagDamageUp;

	statusInitial: BasicStatus;
	status90: BasicStatus;
	status99: BasicStatus;
	status90Yasei5: BasicStatus;
	status99Yasei5: BasicStatus;
	status150: BasicStatus;
	status150Yasei5: BasicStatus;
	status200: BasicStatus;
	status200Yasei5: BasicStatus;

	statusBase: FriendsStatusBase;
}

export interface FriendsDataRow {
	id: string;
	name: string;
	secondName: string;
	isHc: boolean;
	attribute: FriendsAttribute;
	implementDate: string;
	implementType: string;
	implementTypeDetail: string;
	listIndex: number;
	iconUrl: string;
	rarity: number;
	hasYasei5: boolean;
	has12poke: boolean;
	numOfClothes: number;
	cv: string;
	status: FriendsStatus;
}

export interface FriendsStatusListItem {
	friendsDataRow: FriendsDataRow;
	level: number;
	rank: number;
	yasei: 4 | 5;
	status: BasicStatus;
	statusType: '初期ステータス' | '☆6/Lv90/野生4' | '☆6/Lv99/野生4' | '☆6/Lv200/野生4' | '☆6/Lv90/野生5' | '☆6/Lv99/野生5' | '☆6/Lv200/野生5';
}

export interface RawFriendsCSV {
	ID: string;
	フレンズ名: string;
	属性違い二つ名: string;
	HC: boolean;
	ページURL: string;
	属性: string;
	サブ属性: string;
	実装日: string;
	実装種別: string;
	実装種別詳細: string;
	一覧順: number;
	アイコンURL: string;
	初期けも級: number;
	野生大解放: boolean;
	'12ポケ': boolean;
	特別衣装数: number;
	CV: string;
	かいひ: number;
	かいひ野生5: number;
	ぷらずむ: number;
	Beatフラッグ: number;
	Actionフラッグ: string;
	Tryフラッグ: string;
	Beat補正: number;
	Action補正: number;
	Try補正: number;
	Beat補正野生5: number;
	Action補正野生5: number;
	Try補正野生5: number;
	'Lv最大けもステ': number;
	'Lv最大たいりょく': number;
	'Lv最大こうげき': number;
	'Lv最大まもり': number;
	'Lv90けもステ': number;
	'Lv90たいりょく': number;
	'Lv90こうげき': number;
	'Lv90まもり': number;
	'Lv99けもステ': number;
	'Lv99たいりょく': number;
	'Lv99こうげき': number;
	'Lv99まもり': number;
	'Lv90野生5けもステ': number;
	'Lv90野生5たいりょく': number;
	'Lv90野生5こうげき': number;
	'Lv90野生5まもり': number;
	'Lv99野生5けもステ': number;
	'Lv99野生5たいりょく': number;
	'Lv99野生5こうげき': number;
	'Lv99野生5まもり': number;
	'☆1Lv1たいりょく': number;
	'☆1Lv1こうげき': number;
	'☆1Lv1まもり': number;
	'☆1Lv90たいりょく': number,
	'☆1Lv90こうげき': number,
	'☆1Lv90まもり': number,
	'☆1Lv99たいりょく': number,
	'☆1Lv99こうげき': number,
	'☆1Lv99まもり': number,
	'☆1野生解放1-4合計たいりょく': number,
	'☆1野生解放1-4合計こうげき': number,
	'☆1野生解放1-4合計まもり': number,
	'☆1野生解放1-5合計たいりょく': number,
	'☆1野生解放1-5合計こうげき': number,
	'☆1野生解放1-5合計まもり': number,
	'Lv100+上昇パターン': MegumiPattern;
	けものミラクル技名: string;
	けものミラクル効果Lv1: string;
	けものミラクル効果Lv5: string;
	けものミラクル必要MP: number;
	'けものミラクル＋': string;
	とくいわざ技名: string;
	とくいわざ効果: string;
	たいきスキル技名: string;
	たいきスキル効果: string;
	たいきスキル発動率: number;
	たいきスキル発動回数: number;
	とくせい技名: string;
	とくせい効果: string;
	キセキとくせい技名: string;
	キセキとくせい効果: string;
	なないろとくせい技名: string;
	なないろとくせい効果: string;
	自己紹介テキスト: string;
	ずかんテキスト: string;
	動物フォト属性: string;
	動物フォトとくせい効果変化前: string;
	動物フォトとくせい効果変化後: string;
}
