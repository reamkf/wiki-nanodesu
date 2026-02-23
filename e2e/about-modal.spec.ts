import { test, expect } from "@playwright/test";

test.describe("Aboutモーダル", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./");
	});

	test("Aboutボタンが表示される", async ({ page }) => {
		const aboutButton = page.locator(
			'header button:not([aria-label="メニュー"])'
		);
		await expect(aboutButton).toBeVisible();
	});

	test("Aboutボタンをクリックするとモーダルが開く", async ({ page }) => {
		const aboutButton = page.locator(
			'header button:not([aria-label="メニュー"])'
		);
		await aboutButton.click();

		const heading = page.getByRole("heading", {
			name: "このサイトについて",
		});
		await expect(heading).toBeVisible();
	});

	test("モーダルに説明テキストが表示される", async ({ page }) => {
		const aboutButton = page.locator(
			'header button:not([aria-label="メニュー"])'
		);
		await aboutButton.click();

		// ダイアログパネル内の説明テキストを確認
		const dialogPanel = page.locator("[id^='headlessui-dialog-panel']");
		await expect(
			dialogPanel.getByText("を補助するサイトなのです。")
		).toBeVisible();
	});

	test("モーダルにSeesaaWikiへのリンクがある", async ({ page }) => {
		const aboutButton = page.locator(
			'header button:not([aria-label="メニュー"])'
		);
		await aboutButton.click();

		const link = page.getByRole("link", {
			name: "アプリ版けものフレンズ３Wikiなのだ！",
		});
		await expect(link.first()).toBeVisible();
		await expect(link.first()).toHaveAttribute("href", /seesaawiki\.jp/);
	});

	test("閉じるボタンでモーダルを閉じられる", async ({ page }) => {
		const aboutButton = page.locator(
			'header button:not([aria-label="メニュー"])'
		);
		await aboutButton.click();

		const closeButton = page.getByRole("button", { name: "閉じる" });
		await expect(closeButton).toBeVisible();
		await closeButton.click();

		await expect(closeButton).toBeHidden();
	});
});
