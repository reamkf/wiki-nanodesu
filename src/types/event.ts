export interface RawEventCSV {
	イベント名: string;
	バナー画像URL: string;
	バナー画像: string;
	wikiページ: string;
	開催開始: string;
	開催終了: string;
	種別: string;
	実装フレンズ1: string;
	実装フレンズ2: string;
	実装フレンズ3: string;
	実装フレンズ4: string;
	実装フォト1: string;
	実装フォト2: string;
	実装フォト3: string;
	実装フォト4: string;
	[key: string]: unknown;
}

export interface EventDataRow {
	name: string;
	bannerImageUrl: string;
	wikiPage: string;
	startDate: string;
	endDate: string;
	type: string;
	friendNames: string[];
	photoNames: string[];
}

export interface EventRelatedFriend {
	id: string;
	name: string;
	secondName: string;
	iconUrl: string;
}

export interface EventRelatedPhoto {
	name: string;
	rarity: number;
	iconUrl: string;
}

export interface EventDisplayData extends Omit<EventDataRow, "friendNames" | "photoNames"> {
	friends: EventRelatedFriend[];
	photos: EventRelatedPhoto[];
}
