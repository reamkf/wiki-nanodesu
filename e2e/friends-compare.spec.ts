import { test, expect } from "@playwright/test";

test.describe("フレンズ比較ページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(
			"./friends/compare?left=%E3%83%89%E3%83%BC%E3%83%AB&right=%E3%83%89%E3%83%A9%E3%82%B4%E3%83%B3%E3%82%B5%E3%83%BC%E3%83%90%E3%83%AB",
		);
	});

	test("クエリで指定したフレンズを表示する", async ({ page }) => {
		await expect(page.getByRole("heading", { name: "フレンズ比較" })).toBeVisible();
		await expect(page.getByLabel("左のフレンズ")).toHaveValue("ドール");
		await expect(page.getByLabel("右のフレンズ")).toHaveValue("ドラゴンサーバル");
		await expect(page.getByText("疾風のワイルドハント", { exact: true })).toBeVisible();
		await expect(page.getByText("疾風怒濤·薮猫の龍爪", { exact: true })).toBeVisible();
	});

	test("フレンズを変更するとクエリを更新する", async ({ page }) => {
		await page.getByLabel("左のフレンズ").selectOption("カマイタチ・切");
		await expect(page).toHaveURL(
			/left=%E3%82%AB%E3%83%9E%E3%82%A4%E3%82%BF%E3%83%81%E3%83%BB%E5%88%87/,
		);
	});
});
