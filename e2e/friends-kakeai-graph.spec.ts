import { test, expect } from "@playwright/test";

test.describe("フレンズ掛け合いグラフページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./friends-kakeai-graph");
	});

	test("ページタイトルが表示される", async ({ page }) => {
		await expect(
			page.locator("h2", { hasText: "フレンズ掛け合いグラフ" })
		).toBeVisible();
	});

	test("グラフ領域が表示される", async ({ page }) => {
		// SVG要素（D3グラフ）が描画される
		const svg = page.locator("svg");
		await expect(svg.first()).toBeVisible({ timeout: 10000 });
	});

	test("SeesaaWikiへのリンクが存在する", async ({ page }) => {
		const link = page.locator('a[href*="seesaawiki.jp"]');
		await expect(link.first()).toBeVisible();
	});
});
