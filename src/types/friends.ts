import { BasicStatus } from "./common";

export enum FriendsAttribute {
	friendry = "friendry",
	funny = "funny",
	relax = "relax",
	active = "active",
	lovely = "lovely",
	mypace = "mypace"
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

export interface FriendsFlagDamageUp {
	beat: number;
	action: number;
	try: number;
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
	avoid: number;
	avoidYasei5: number;

	plasm: number;

	beatFlags: number;
	actionFlags: number[];
	tryFlags: number[];

	flagDamageUp: FriendsFlagDamageUp;
	flagDamageUpYasei5: FriendsFlagDamageUp;

	statusInitial: BasicStatus;
	status90: BasicStatus;
	status99: BasicStatus;
	status90Yasei5: BasicStatus;
	status99Yasei5: BasicStatus;

	statusBase: FriendsStatusBase;
}

export interface FriendsDataRow {
	id: string;
	name: string;
	second_name: string;
	attribute: FriendsAttribute;
	implement_date: string;
	implement_type: string;
	implement_type_detail: string;
	list_index: number;
	icon_url: string;
	rarity: number;
	has_yasei5: boolean;
	has_12poke: boolean;
	num_of_clothes: number;
	cv: string;
	status: FriendsStatus;
}

export interface RawFriendsCSV {
	ID: string;
	フレンズ名: string;
	属性違い二つ名: string;
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
	'wiki URL': string;
}