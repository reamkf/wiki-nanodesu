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
			name: "かがやけリクホク☆じょーとーの段！",
			bannerImageUrl:
				"https://image02.seesaawiki.jp/k/h/kemono_friends3_5ch/5c9e7033d01c83ce.PNG",
			wikiPage: "",
			startDate: "2026/09/03",
			endDate: "2026/10/01 14:00:00",
			type: "シナリオ(マップ)",
			friendNames: ["《村落獅子》シーサー・ライト"],
			photoNames: ["守り神の度胸試し"],
		});
	});
});

describe("getEventDisplayData", () => {
	it("フレンズとフォトを表示用データへ解決できる", async () => {
		const firstEvent = (await getEventDisplayData())[0];
		expect(firstEvent.friends).toEqual([
			{
				id: "《村落獅子》シーサー・ライト",
				name: "シーサー・ライト",
				secondName: "《村落獅子》",
				iconUrl: expect.any(String),
			},
		]);
		expect(firstEvent.photos.map((photo) => photo.name)).toEqual(["守り神の度胸試し"]);
	});
});

describe("formatEventDate", () => {
	it("曜日と時刻を付けて表示する", () => {
		expect(formatEventDate("2026/09/03 14:00:00")).toBe("2026/09/03(木) 14:00");
		expect(formatEventDate("")).toBe("-");
	});
});
