import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { RawFriendsCSV } from "@/types/friends";
import { getFriendsData } from "@/utils/friends";

const csvPath = join(process.cwd(), "csv", "フレンズデータ.csv");
const csvFile = readFileSync(csvPath, "utf-8");

Papa.parse(csvFile, {
	header: true,
	dynamicTyping: true,
	complete: async (results) => {
		const data = results.data as RawFriendsCSV[];
		console.log("=== CSVパース結果 ===");
		console.log("データ件数:", data.length);
		console.log("\n=== 1件目のRawFriendsCSV ===");
		console.log(JSON.stringify(data[0], null, 2));

		// エラーチェック
		console.log("\n=== パースエラー ===");
		if (results.errors.length > 0) {
			console.log(results.errors);
		} else {
			console.log("エラーなし");
		}

		// 型チェック
		console.log("\n=== 型チェック ===");
		const firstRow = data[0];
		console.log("ID:", typeof firstRow.ID);
		console.log("フレンズ名:", typeof firstRow.フレンズ名);
		console.log("属性:", typeof firstRow.属性);
		console.log("かいひ:", typeof firstRow.かいひ);
		console.log("Actionフラッグ:", typeof firstRow.Actionフラッグ);
		console.log("Lv100+上昇パターン:", typeof firstRow['Lv100+上昇パターン']);

		// FriendsDataRowへの変換結果
		console.log("\n=== FriendsDataRowへの変換結果 ===");
		const result = await getFriendsData();
		if ('props' in result) {
			console.log(JSON.stringify(result, null, 2));
		}
	}
});