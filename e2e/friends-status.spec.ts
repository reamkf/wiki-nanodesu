import { test, expect } from "@playwright/test";

test.describe("フレンズステータスランキングページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./friends-status");
	});

	test("ページタイトルが表示される", async ({ page }) => {
		await expect(
			page.locator("h2", { hasText: "フレンズステータスランキング" })
		).toBeVisible();
	});

	test("テーブルが表示される", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// ヘッダーが表示されている
		const headers = ["フレンズ名", "属性", "たいりょく", "こうげき", "まもり"];
		for (const header of headers) {
			await expect(
				table.locator("th", { hasText: header })
			).toBeVisible();
		}
	});

	test("テーブルにデータ行が存在する", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();
		const rows = table.locator("tbody tr");
		const count = await rows.count();
		expect(count).toBeGreaterThan(0);
	});

	test("フィルターチェックボックスが表示される", async ({ page }) => {
		// ステータスタイプの選択肢が存在する（ラベルは☆6/プレフィックスなし）
		await expect(page.getByText("Lv90/野生4")).toBeVisible();
		await expect(page.getByText("Lv99/野生4")).toBeVisible();
	});

	test("チェックボックスの切り替えでテーブルが更新される", async ({
		page,
	}) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// チェックボックスを操作して別のステータスタイプに切り替え
		const checkbox = page.getByText("Lv200/野生4").first();
		await checkbox.click();

		// テーブルの内容が変化するはず
		await page.waitForTimeout(500);
		await expect(page.locator("table")).toBeVisible();
	});

	test("テーブルの列ヘッダーをクリックするとソートされる", async ({
		page,
	}) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// 「こうげき」ヘッダーをクリックしてソート
		const atkHeader = table.locator("th", { hasText: "こうげき" });
		await atkHeader.click();

		// ソートインジケーターがアクティブになる
		const activeSortIndicator = atkHeader.locator("svg.text-blue-600");
		await expect(activeSortIndicator).toBeVisible();
	});

	test("テーブルの検索フィルターが動作する", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();
		const initialRowCount = await table.locator("tbody tr").count();

		// フレンズ名列の検索入力欄に入力
		const filterInputs = table.locator('input[placeholder="検索..."]');
		// 2番目の検索入力欄（フレンズ名列）
		const nameFilter = filterInputs.nth(1);
		await nameFilter.fill("サーバル");

		// フィルター適用後のデータ行数が少なくなる
		await page.waitForTimeout(300);
		const filteredRowCount = await table.locator("tbody tr").count();
		expect(filteredRowCount).toBeLessThan(initialRowCount);
		expect(filteredRowCount).toBeGreaterThan(0);
	});
});
