import { test, expect } from "@playwright/test";

test.describe("状態異常スキル一覧ページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./abnormal-status-skills");
	});

	test("ページタイトルが表示される", async ({ page }) => {
		await expect(
			page.locator("h2", { hasText: "状態異常スキル一覧" })
		).toBeVisible();
	});

	test("状態異常カテゴリが表示される", async ({ page }) => {
		// 主要な状態異常名がページに存在する
		const statuses = ["くらくら", "どく", "すやすや"];
		for (const status of statuses) {
			await expect(
				page.getByText(status, { exact: false }).first()
			).toBeAttached();
		}
	});

	test("折りたたみセクションを展開するとテーブルが表示される", async ({
		page,
	}) => {
		// FoldingSectionはデフォルトで折りたたまれており、unmountOnExitでテーブルはDOMにない
		// SSGのHTMLにはボタンが存在するが、React hydration完了まではonClickが動かない
		// hydration完了を待つため、クリック後にテーブルが現れなければリトライする
		const toggleButton = page
			.locator("button.MuiButton-sizeSmall.text-gray-500")
			.first();
		await expect(toggleButton).toBeVisible({ timeout: 10000 });

		const table = page.locator("table").first();
		await expect(async () => {
			await toggleButton.click();
			await expect(table).toBeVisible({ timeout: 2000 });
		}).toPass({ timeout: 15000 });
	});

	test("展開されたテーブルに適切なヘッダーが表示される", async ({
		page,
	}) => {
		// セクションを展開（hydration待ちリトライ付き）
		const toggleButton = page
			.locator("button.MuiButton-sizeSmall.text-gray-500")
			.first();
		await expect(toggleButton).toBeVisible({ timeout: 15000 });

		const table = page.locator("table").first();
		await expect(async () => {
			await toggleButton.click();
			await expect(table).toBeVisible({ timeout: 2000 });
		}).toPass({ timeout: 15000 });

		const headers = ["属性", "わざ種別"];
		for (const header of headers) {
			await expect(
				table.locator("th", { hasText: header })
			).toBeVisible();
		}
	});
});
