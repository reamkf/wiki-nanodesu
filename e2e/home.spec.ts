import { test, expect } from "@playwright/test";

test.describe("ホームページ", () => {
	test("ページが正しく表示される", async ({ page }) => {
		await page.goto("./");
		await expect(page).toHaveTitle(/けものフレンズ/);
	});

	test("ページタイトルが表示される", async ({ page }) => {
		await page.goto("./");
		const heading = page.locator("h2", { hasText: "トップページ" });
		await expect(heading).toBeVisible();
	});

	test("説明テキストが表示される", async ({ page }) => {
		await page.goto("./");
		await expect(
			page.getByText("を補助するサイトなのです。")
		).toBeVisible();
	});

	test("SeesaaWikiへのリンクが存在する", async ({ page }) => {
		await page.goto("./");
		const link = page.getByRole("link", {
			name: "アプリ版けものフレンズ３Wikiなのだ！",
		});
		await expect(link.first()).toBeVisible();
		await expect(link.first()).toHaveAttribute(
			"href",
			/seesaawiki\.jp/
		);
	});

	test("メインビジュアル画像が表示される", async ({ page }) => {
		await page.goto("./");
		const image = page.getByAltText("メインビジュアル");
		await expect(image).toBeVisible();
	});
});
