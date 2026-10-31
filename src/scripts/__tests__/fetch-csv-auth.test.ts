import { expect, spyOn, test } from "bun:test";
import { fetchSheetData } from "../../../scripts/fetch-csv-from-sheets";

test("fetch-csvはAPIキーではなくBearerトークンで取得する", async () => {
	const mock = spyOn(globalThis, "fetch").mockResolvedValue(
		Response.json({ values: [["名前", "値"]] }),
	);
	try {
		expect(
			await fetchSheetData("test-token", { sheetName: "テスト", filePath: "test.csv" }),
		).toEqual([["名前", "値"]]);
		expect(mock).toHaveBeenCalledTimes(1);
		const [url, options] = mock.mock.calls[0];
		expect(new URL(String(url)).searchParams.has("key")).toBe(false);
		expect(options?.headers).toEqual({ Authorization: "Bearer test-token" });
	} finally {
		mock.mockRestore();
	}
});
