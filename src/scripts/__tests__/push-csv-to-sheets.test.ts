import { describe, expect, spyOn, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { JWT } from "google-auth-library";
import { parseCsv } from "../../../scripts/csv-rows";
import { getSheetsAccessToken } from "../../../scripts/sheets-auth";

const config = {
	sheetName: "フレンズ'掛け合い",
	filePath: "test.csv",
	range: { startColumn: 4, endColumn: 5 },
};

describe("push-csv", () => {
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
});
