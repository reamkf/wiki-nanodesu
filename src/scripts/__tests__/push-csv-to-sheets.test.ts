import { describe, expect, spyOn, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { JWT } from "google-auth-library";
import { sheetConfigs } from "../../../scripts/fetch-csv-from-sheets";
import {
	createUpdates,
	getFormulaCells,
	getSheetsAccessToken,
	parseCsv,
} from "../../../scripts/push-csv-to-sheets";

const config = {
	sheetName: "フレンズ'掛け合い",
	filePath: "test.csv",
	range: { startColumn: 4, endColumn: 5 },
};

describe("push-csv", () => {
	test("数式セルの位置を開始行・列のオフセット込みで取得する", () => {
		expect(
			getFormulaCells({
				properties: { title: "テスト" },
				data: [
					{
						startRow: 2,
						startColumn: 3,
						rowData: [{ values: [{ userEnteredValue: { formulaValue: "=1+1" } }, {}] }],
					},
					{
						rowData: [
							{ values: [{ userEnteredValue: { formulaValue: "=SUM(A2:A3)" } }] },
						],
					},
				],
			}),
		).toEqual(new Set(["3:4", "1:1"]));
	});
	test("数式セルは値の変更時も空セルによる削除時も更新しない", () => {
		for (const skipEmpty of [true, false]) {
			expect(
				createUpdates(
					config,
					[
						["変更", ""],
						["通常", "更新"],
					],
					[
						["計算結果", "計算結果"],
						["以前", "以前"],
					],
					skipEmpty,
					new Set(["1:4", "1:5"]),
				),
			).toEqual([
				{ range: "'フレンズ''掛け合い'!D2", values: [["通常"]] },
				{ range: "'フレンズ''掛け合い'!E2", values: [["更新"]] },
			]);
		}
	});
	test("CSVに存在しない行の数式も削除しない", () => {
		expect(
			createUpdates(
				config,
				[["同じ", "同じ"]],
				[
					["同じ", "同じ"],
					["数式", "数式"],
				],
				false,
				new Set(["2:4", "2:5"]),
			),
		).toEqual([]);
	});
	test("サービスアカウントでSheetsスコープのトークンを取得する", async () => {
		const dir = mkdtempSync(join(tmpdir(), "sheets-auth-"));
		const keyFile = join(dir, "service-account.json");
		writeFileSync(
			keyFile,
			JSON.stringify({
				client_email: "test@example.iam.gserviceaccount.com",
				private_key: "test-key",
			}),
		);
		const mock = spyOn(JWT.prototype, "getAccessToken").mockImplementation(async function (
			this: JWT,
		) {
			expect(this.email).toBe("test@example.iam.gserviceaccount.com");
			expect(this.key).toBe("test-key");
			expect(this.scopes).toEqual(["https://www.googleapis.com/auth/spreadsheets"]);
			return { token: "automatic-token" };
		});
		try {
			expect(
				await getSheetsAccessToken({
					GOOGLE_APPLICATION_CREDENTIALS: keyFile,
				}),
			).toBe("automatic-token");
		} finally {
			mock.mockRestore();
			rmSync(dir, { recursive: true });
		}
	});
	test("鍵のパスが未設定ではエラーになる", async () => {
		await expect(getSheetsAccessToken({})).rejects.toThrow("GOOGLE_APPLICATION_CREDENTIALS");
	});
	test("存在しない鍵ファイルを拒否する", async () => {
		await expect(
			getSheetsAccessToken({ GOOGLE_APPLICATION_CREDENTIALS: "/invalid.json" }),
		).rejects.toThrow("ENOENT");
	});
	test("引用符、改行、空セル、BOMとCRLFを読み取る", () => {
		expect(parseCsv('\uFEFF名前,説明\r\n"A,B","複数\n行"\r\n"引用""符",\r\n', config)).toEqual([
			["名前", "説明"],
			["A,B", "複数\n行"],
			['引用"符', ""],
		]);
	});
	test("空ファイル、不正な引用符、列数の不一致を拒否する", () => {
		for (const text of ["", "\n", 'a,"b', "a,b\nc", "a,b,c"]) {
			expect(() => parseCsv(text, config)).toThrow();
		}
	});
	test("指定範囲の変更と削除だけを更新する", () => {
		expect(
			createUpdates(
				config,
				[
					["名前", "説明"],
					["更新", ""],
				],
				[["名前", "説明"], ["以前", "削除"], ["余分"]],
				false,
			),
		).toEqual([
			{ range: "'フレンズ''掛け合い'!D2", values: [["更新"]] },
			{ range: "'フレンズ''掛け合い'!E2", values: [[""]] },
			{ range: "'フレンズ''掛け合い'!D3", values: [[""]] },
		]);
	});
	test("デフォルトでは空セルをスキップしリモートの値とCSVにない行を保持する", () => {
		expect(
			createUpdates(
				config,
				[
					["更新", ""],
					["", " "],
				],
				[["以前", "保持"], ["保持", "以前"], ["余分"]],
			),
		).toEqual([
			{ range: "'フレンズ''掛け合い'!D1", values: [["更新"]] },
			{ range: "'フレンズ''掛け合い'!E2", values: [[" "]] },
		]);
	});
	test("数式と同じ表示値は更新せず、入力値は文字列のまま保持する", () => {
		expect(createUpdates(config, [["001", "=SUM(A1)"]], [["001", "結果"]])).toEqual([
			{ range: "'フレンズ''掛け合い'!E1", values: [["=SUM(A1)"]] },
		]);
	});
	test("リポジトリの全CSVを検証できる", () => {
		for (const sheet of sheetConfigs) {
			expect(parseCsv(readFileSync(sheet.filePath, "utf8"), sheet).length).toBeGreaterThan(0);
		}
	});
});
