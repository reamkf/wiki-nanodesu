import { test, expect } from "@playwright/test";

test.describe("ライセンスページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./license");
	});

	test("免責事項セクションが表示される", async ({ page }) => {
		await expect(page.locator("#heading-disclaimer")).toBeAttached();
		await expect(
			page.getByRole("heading", { name: "免責事項" })
		).toBeVisible();
	});

	test("ゲーム内画像についてのセクションが表示される", async ({
		page,
	}) => {
		await expect(page.locator("#heading-license-image")).toBeAttached();
	});

	test("オープンソースライセンスセクションが表示される", async ({
		page,
	}) => {
		await expect(page.locator("#heading-open-source-licenses")).toBeAttached();
		await expect(
			page.getByText("オープンソースライセンス")
		).toBeVisible();
	});

	test("ライセンス一覧が表示される", async ({ page }) => {
		// ライセンス項目のリストが存在する
		const licenseItems = page.locator("ul li");
		const count = await licenseItems.count();
		expect(count).toBeGreaterThan(0);
	});

	test("ライセンス全文を展開できる", async ({ page }) => {
		// details/summaryで折りたたまれているライセンス全文
		const details = page.locator("details").first();
		if ((await details.count()) > 0) {
			const summary = details.locator("summary");
			await expect(summary).toBeVisible();
			await summary.click();

			// 展開後、内部のテキストが表示される
			await expect(details).toHaveAttribute("open", "");
		}
	});
});
