import { test, expect } from "@playwright/test";

test.describe("目次ダイアログ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./friends-skills");
	});

	test("目次ボタンが表示される", async ({ page }) => {
		const tocButton = page.getByRole("button", { name: "目次" });
		await expect(tocButton.first()).toBeVisible();
	});

	test("目次ボタンをクリックするとダイアログが開く", async ({ page }) => {
		const tocButton = page.getByRole("button", { name: "目次" });
		await expect(tocButton.first()).toBeVisible();

		await tocButton.first().click();

		const heading = page.getByRole("heading", { name: "目次" });
		await expect(heading).toBeVisible();
	});

	test("目次ダイアログに検索フィールドがある", async ({ page }) => {
		const tocButton = page.getByRole("button", { name: "目次" });
		await expect(tocButton.first()).toBeVisible();
		await tocButton.first().click();

		const searchField = page.getByPlaceholder("目次を検索...");
		await expect(searchField).toBeVisible();
	});

	test("目次ダイアログの検索が動作する", async ({ page }) => {
		const tocButton = page.getByRole("button", { name: "目次" });
		await expect(tocButton.first()).toBeVisible();
		await tocButton.first().click();

		const searchField = page.getByPlaceholder("目次を検索...");
		await expect(searchField).toBeVisible();
		await searchField.fill("バフ");

		// 検索結果としてツリーリスト内に項目が表示される
		const dialogPanel = page.locator("[id^='headlessui-dialog-panel']");
		await expect(
			dialogPanel.getByRole("button", { name: "バフ", exact: true })
		).toBeVisible();
	});

	test("目次ダイアログを閉じることができる", async ({ page }) => {
		const tocButton = page.getByRole("button", { name: "目次" });
		await expect(tocButton.first()).toBeVisible();
		await tocButton.first().click();

		const searchField = page.getByPlaceholder("目次を検索...");
		await expect(searchField).toBeVisible();

		// Escキーでダイアログを閉じる
		await page.keyboard.press("Escape");

		await expect(searchField).toBeHidden();
	});

	test("キーボードショートカットで目次ダイアログが開く", async ({
		page,
	}) => {
		// Ctrl+Shift+O で目次ダイアログを開く
		await page.keyboard.press("Control+Shift+O");

		const heading = page.getByRole("heading", { name: "目次" });
		await expect(heading).toBeVisible();
	});
});
