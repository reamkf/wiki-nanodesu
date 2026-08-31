import { describe, expect, it } from "bun:test";
import { getEventData, getEventDisplayData } from "@/data/eventData";
import { formatEventDate } from "@/utils/eventDate";

describe("getEventData", () => {
	it("イベントデータを読み込める", async () => {
		const events = await getEventData();
		expect(events.length).toBeGreaterThan(0);
	});

	it("先頭イベントの列を変換できる", async () => {
		const firstEvent = (await getEventData())[0];
		expect(firstEvent).toEqual({
			name: "全国区のアイドルへの第一歩！ですわ！",
			bannerImageUrl: "https://image02.seesaawiki.jp/k/h/kemono_friends3_5ch/8c2703602d0e33c3.PNG",
			wikiPage: "",
			startDate: "2026/08/20",
			endDate: "2026/09/03 14:00:00",
			type: "シナリオ(コラボ)",
			friendNames: ["東北イタコ", "東北きりたん"],
			photoNames: ["ペラリとお悩み解決！", "ぎゅぎゅっとおいしい"],
		});
	});
});

describe("getEventDisplayData", () => {
	it("フレンズとフォトを表示用データへ解決できる", async () => {
		const firstEvent = (await getEventDisplayData())[0];
		expect(firstEvent.friends.map((friend) => friend.name)).toEqual(["東北イタコ", "東北きりたん"]);
		expect(firstEvent.photos.map((photo) => photo.name)).toEqual([
			"ペラリとお悩み解決！",
			"ぎゅぎゅっとおいしい",
		]);
	});
});

describe("formatEventDate", () => {
	it("曜日と時刻を付けて表示する", () => {
		expect(formatEventDate("2026/09/03 14:00:00")).toBe("2026/09/03(木) 14:00");
		expect(formatEventDate("")).toBe("-");
	});
});
