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

	test("変化前/変化後フィルターの切り替えでテーブルが更新される", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// ページネーションのページ数テキストを取得（「1 / N」形式）
		const paginationText = page.locator("text=/\\d+\\s*\\/\\s*\\d+/");
		const initialPaginationText = await paginationText.first().textContent();

		// 「変化前」ラベルをクリックしてチェックを外す
		const filterLabels = page.locator("label div.text-base");
		await filterLabels.filter({ hasText: "変化前" }).click();

		await page.waitForTimeout(500);

		// ページネーションのページ数が変化したことを確認
		const updatedPaginationText = await paginationText.first().textContent();
		expect(updatedPaginationText).not.toBe(initialPaginationText);
	});

	test("レアリティフィルターの切り替えでテーブルが更新される", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();
		const initialRowCount = await table.locator("tbody tr").count();

		// 「☆3」ラベルをクリックしてチェックを外す
		const filterLabels = page.locator("label div.text-base");
		await filterLabels.filter({ hasText: "☆3" }).click();

		await page.waitForTimeout(500);
		const updatedRowCount = await table.locator("tbody tr").count();
		expect(updatedRowCount).toBeLessThanOrEqual(initialRowCount);
		await expect(table).toBeVisible();
	});

	test("基礎攻撃力の入力欄が存在する", async ({ page }) => {
		// こうげき値設定のセクションヘッダーを確認
		const settingLabel = page.locator("h3", { hasText: "こうげき値設定" });
		await expect(settingLabel).toBeVisible();

		// MUI Selectコンポーネントの表示値を確認
		const settingSection = settingLabel.locator("..");
		const selectDisplay = settingSection.locator(".MuiSelect-select");
		await expect(selectDisplay).toBeVisible();

		// 数値が表示されていることを確認
		const displayText = await selectDisplay.textContent();
		expect(displayText).toMatch(/[\d,]+/);
	});
});
