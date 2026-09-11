import { test, expect } from "@playwright/test";

test.describe("フレンズ個別ページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./friends/%E3%83%89%E3%83%BC%E3%83%AB");
	});

	test("基本情報とスキルが表示される", async ({ page }) => {
		await expect(page.locator("h1", { hasText: "ドール" })).toBeVisible();
		await expect(page.getByText("疾風のワイルドハント", { exact: true })).toBeVisible();
		await expect(page.getByText("ロック・オン！", { exact: true })).toBeVisible();
		await expect(page.getByText("親愛なる私のおともだちへ", { exact: true })).toBeVisible();
	});

	test("ステータスのレベルと野生解放を切り替えられる", async ({ page }) => {
		const levelGroup = page.getByRole("group", { name: "レベル" });
		const yaseiGroup = page.getByRole("group", { name: "野生解放" });

		await levelGroup.getByRole("button", { name: "Lv200" }).click();
		await yaseiGroup.getByRole("button", { name: "野生5" }).click();
		await expect(levelGroup.getByRole("button", { name: "Lv200" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect(yaseiGroup.getByRole("button", { name: "野生5" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	test("既存Wikiと内部ページへのリンクが表示される", async ({ page }) => {
		await expect(page.getByRole("link", { name: "比較する" })).toHaveAttribute(
			"href",
			"/wiki-nanodesu/friends/compare?left=%E3%83%89%E3%83%BC%E3%83%AB",
		);
		await expect(page.getByRole("link", { name: "既存Wikiで見る" })).toBeVisible();
	});
});
