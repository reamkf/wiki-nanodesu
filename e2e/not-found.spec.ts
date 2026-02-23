import { test, expect } from "@playwright/test";

test.describe("404ページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./this-page-does-not-exist");
	});

	test("存在しないURLにアクセスすると404ページが表示される", async ({
		page,
	}) => {
		const heading = page.locator("h2", {
			hasText: "ページが見つかりません",
		});
		await expect(heading).toBeVisible();
	});

	test("説明テキストが表示される", async ({ page }) => {
		await expect(
			page.getByText("お探しのページは存在しないか")
		).toBeVisible();
	});

	test("トップページへのリンクが存在する", async ({ page }) => {
		const link = page.getByRole("link", { name: "トップに戻る" });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute("href", /wiki-nanodesu/);
	});

	test("トップに戻るリンクをクリックするとホームに遷移する", async ({
		page,
	}) => {
		const link = page.getByRole("link", { name: "トップに戻る" });
		await link.click();

		await expect(
			page.locator("h2", { hasText: "トップページ" })
		).toBeVisible();
	});
});
