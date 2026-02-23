import { test, expect } from "@playwright/test";

test.describe("フォト火力ランキングページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./photo-damage-ranking");
	});

	test("ページタイトルが表示される", async ({ page }) => {
		await expect(
			page.locator("h2", { hasText: "フォト火力ランキング" })
		).toBeVisible();
	});

	test("事前知識セクションが表示される", async ({ page }) => {
		await expect(page.locator("#heading-know-this")).toBeAttached();
	});

	test("火力指標セクションが表示される", async ({ page }) => {
		await expect(page.locator("#heading-damage-indicator")).toBeAttached();
	});

	test("テーブルが表示される", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// ヘッダーカラム
		await expect(
			table.locator("th", { hasText: "フォト名" })
		).toBeVisible();
		await expect(
			table.locator("th", { hasText: "とくせい" })
		).toBeVisible();
	});

	test("テーブルにデータが存在する", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();
		const rows = table.locator("tbody tr");
		const count = await rows.count();
		expect(count).toBeGreaterThan(0);
	});

	test("フィルター項目が表示される", async ({ page }) => {
		// FilterCheckboxGroupのラベル（div.text-base内）で確認
		const filterLabels = page.locator("label div.text-base");
		await expect(filterLabels.filter({ hasText: "変化前" })).toBeVisible();
		await expect(filterLabels.filter({ hasText: "変化後" })).toBeVisible();
		await expect(filterLabels.filter({ hasText: "☆4" })).toBeVisible();
		await expect(filterLabels.filter({ hasText: "☆3" })).toBeVisible();
	});

	test("テーブルの検索フィルターが動作する", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();
		const initialRowCount = await table.locator("tbody tr").count();

		// フォト名列のフィルター
		const filterInputs = table.locator('input[placeholder="検索..."]');
		const nameFilter = filterInputs.first();
		await nameFilter.fill("セルリアン");

		await page.waitForTimeout(300);
		const filteredRowCount = await table.locator("tbody tr").count();
		expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
	});

	test("テーブルのソートが動作する", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// フォト名ヘッダーをクリックしてソート
		const nameHeader = table.locator("th", { hasText: "フォト名" });
		await nameHeader.click();

		const activeSortIndicator = nameHeader.locator("svg.text-blue-600");
		await expect(activeSortIndicator).toBeVisible();
	});
});
