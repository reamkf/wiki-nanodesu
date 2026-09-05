import { getFriendsData } from "@/data/friendsData";
import { getPhotoData } from "@/data/photoData";
import { RawEventCSV, EventDataRow, EventDisplayData } from "@/types/event";
import { readCsv } from "@/utils/readCsv";
import { FriendsDataRow } from "@/types/friends";
import { PhotoDataRow } from "@/types/photo";

const FRIEND_COLUMNS = [
	"実装フレンズ1",
	"実装フレンズ2",
	"実装フレンズ3",
	"実装フレンズ4",
] as const;

const PHOTO_COLUMNS = ["実装フォト1", "実装フォト2", "実装フォト3", "実装フォト4"] as const;

function getNames(row: RawEventCSV, columns: readonly string[]): string[] {
	return columns
		.map((column) => row[column])
		.filter((value): value is string => typeof value === "string" && value.trim() !== "");
}

function parseEventRows(data: RawEventCSV[]): EventDataRow[] {
	return data.map((row) => ({
		name: row.イベント名 || "",
		bannerImageUrl: row.バナー画像URL || "",
		wikiPage: row.wikiページ || "",
		startDate: row.開催開始 || "",
		endDate: row.開催終了 || "",
		type: row.種別 || "",
		friendNames: getNames(row, FRIEND_COLUMNS),
		photoNames: getNames(row, PHOTO_COLUMNS),
	}));
}

let eventDataCache: EventDataRow[] | null = null;

export async function getEventData(): Promise<EventDataRow[]> {
	if (eventDataCache) return eventDataCache;

	eventDataCache = await readCsv<RawEventCSV, EventDataRow>(
		"イベントデータ.csv",
		{},
		parseEventRows,
	);
	return eventDataCache;
}

function createFriendMap(friends: FriendsDataRow[]): Map<string, FriendsDataRow> {
	return new Map(friends.map((friend) => [friend.id, friend]));
}

function createPhotoMap(photos: PhotoDataRow[]): Map<string, PhotoDataRow> {
	return new Map(photos.map((photo) => [photo.name, photo]));
}

export async function getEventDisplayData(): Promise<EventDisplayData[]> {
	const [events, friends, photos] = await Promise.all([
		getEventData(),
		getFriendsData(),
		getPhotoData(),
	]);
	const friendMap = createFriendMap(friends);
	const photoMap = createPhotoMap(photos);

	return events.map((event) => ({
		name: event.name,
		bannerImageUrl: event.bannerImageUrl,
		wikiPage: event.wikiPage,
		startDate: event.startDate,
		endDate: event.endDate,
		type: event.type,
		friends: event.friendNames.map((name) => {
			const friend = friendMap.get(name);
			return {
				id: friend?.id || name,
				name: friend?.name || name,
				secondName: friend?.secondName || "",
				iconUrl: friend?.iconUrl || "",
			};
		}),
		photos: event.photoNames.map((name) => {
			const photo = photoMap.get(name);
			return {
				name: photo?.name || name,
				rarity: photo?.rarity || 0,
				iconUrl: photo?.iconUrl || "",
			};
		}),
	}));
}
