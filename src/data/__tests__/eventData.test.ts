import { describe, expect, it } from "bun:test";
import { getEventData, getEventDisplayData } from "@/data/eventData";
import { formatEventDate } from "@/utils/eventDate";

describe("getEventData", () => {
	it("イベントデータを読み込める", async () => {
		const events = await getEventData();
		expect(events.length).toBeGreaterThan(0);
	});

	it("特定イベントの列を変換できる", async () => {
		// 新規レコードは先頭行に追加されるため、名前で検索する
		const targetEvent = (await getEventData()).find(
			(event) => event.name === "かがやけリクホク☆じょーとーの段！",
		);
		expect(targetEvent).toEqual({
			name: "かがやけリクホク☆じょーとーの段！",
			bannerImageUrl:
				"https://image02.seesaawiki.jp/k/h/kemono_friends3_5ch/5c9e7033d01c83ce.PNG",
			wikiPage: "",
			startDate: "2026/09/03",
			endDate: "2026/10/01 14:00:00",
			type: "シナリオ(マップ)",
			friendNames: ["《村落獅子》シーサー・ライト", "《村落獅子》シーサー・レフティ"],
			photoNames: ["守り神の度胸試し", "悪い奴はさよ～なら～！", "なないろのアーチへ！"],
		});
	});
});

describe("getEventDisplayData", () => {
	it("フレンズとフォトを表示用データへ解決できる", async () => {
		// 新規レコードは先頭行に追加されるため、名前で検索する
		const targetEvent = (await getEventDisplayData()).find(
			(event) => event.name === "かがやけリクホク☆じょーとーの段！",
		);
		expect(targetEvent?.friends).toEqual([
			{
				id: "《村落獅子》シーサー・ライト",
				name: "シーサー・ライト",
				secondName: "《村落獅子》",
				iconUrl: expect.any(String),
			},
			{
				id: "《村落獅子》シーサー・レフティ",
				name: "シーサー・レフティ",
				secondName: "《村落獅子》",
				iconUrl: expect.any(String),
			},
		]);
		expect(targetEvent?.photos.map((photo) => photo.name)).toEqual([
			"守り神の度胸試し",
			"悪い奴はさよ～なら～！",
			"なないろのアーチへ！",
		]);
	});
});

describe("formatEventDate", () => {
	it("曜日と時刻を付けて表示する", () => {
		expect(formatEventDate("2026/09/03 14:00:00")).toBe("2026/09/03(木) 14:00");
		expect(formatEventDate("")).toBe("-");
	});
});
