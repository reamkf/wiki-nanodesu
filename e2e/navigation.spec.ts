import { test, expect } from "@playwright/test";

test.describe("ナビゲーション", () => {
	test("ヘッダーが表示される", async ({ page }) => {
		await page.goto("./");
		const header = page.locator("header");
		await expect(header).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /けものフレンズ/ })
		).toBeVisible();
	});

	test("ヘッダーのアイコン画像が表示される", async ({ page }) => {
		await page.goto("./");
		const header = page.locator("header");
		const icon = header.getByAltText("「の」のアイコン");
		await expect(icon).toBeVisible();
	});

	test("フッターが表示される", async ({ page }) => {
		await page.goto("./");
		const footer = page.locator("footer");
		await expect(footer).toBeVisible();
	});

	test("フッターにライセンスリンクがある", async ({ page }) => {
		await page.goto("./");
		const licenseLink = page
			.locator("footer")
			.getByRole("link", { name: "License" });
		await expect(licenseLink).toBeVisible();
	});

	test("フッターにGitHubリンクがある", async ({ page }) => {
		await page.goto("./");
		const githubLink = page
			.locator("footer")
			.locator('a[href*="github.com"]');
		await expect(githubLink).toBeVisible();
	});
});

test.describe("サイドバー", () => {
	/** モバイルビューポートの場合、ハンバーガーメニューを開いてサイドバーを表示する */
	async function openSidebarIfMobile(page: import("@playwright/test").Page) {
		const viewport = page.viewportSize();
		if (viewport && viewport.width < 768) {
			const menuButton = page.getByLabel("メニュー");
			await menuButton.click();
		}
	}

	test("デスクトップでサイドバーが表示される", async ({ page }) => {
		await page.goto("./");
		await openSidebarIfMobile(page);
		const sidebar = page.locator("aside");
		await expect(sidebar).toBeVisible();
	});

	test("サイドバーにナビゲーションリンクが存在する", async ({ page }) => {
		await page.goto("./");
		await openSidebarIfMobile(page);
		const sidebar = page.locator("aside");

		const expectedLinks = [
			"状態異常スキル一覧",
			"スキル別フレンズ一覧",
			"フレンズステータスランキング",
			"フレンズ掛け合いグラフ",
			"フォト火力ランキング",
		];

		for (const linkText of expectedLinks) {
			await expect(sidebar.getByText(linkText)).toBeVisible();
		}
	});

	test("サイドバーの検索機能が動作する", async ({ page }) => {
		await page.goto("./");
		await openSidebarIfMobile(page);
		const sidebar = page.locator("aside");
		const searchInput = sidebar.getByPlaceholder("ページを検索...");
		await expect(searchInput).toBeVisible();

		// 検索文字を入力
		await searchInput.fill("ステータス");
		// 一致するリンクが表示される
		await expect(
			sidebar.getByText("フレンズステータスランキング")
		).toBeVisible();

		// クリアボタンで検索をリセット
		const clearButton = sidebar.getByLabel("検索をクリア");
		await clearButton.click();
		await expect(searchInput).toHaveValue("");
	});

	test("サイドバーからページ遷移できる", async ({ page }) => {
		await page.goto("./");
		await openSidebarIfMobile(page);
		const sidebar = page.locator("aside");

		await sidebar
			.getByRole("link", { name: "フレンズステータスランキング" })
			.click();
		await page.waitForURL("**/friends-status");

		await expect(
			page.locator("h2", { hasText: "フレンズステータスランキング" })
		).toBeVisible();
	});
});

test.describe("サイドバー（モバイル）", () => {
	test.skip(
		({ page }) => {
			const viewport = page.viewportSize();
			return viewport !== null && viewport.width >= 768;
		},
		"デスクトップサイズではスキップ"
	);

	test("ハンバーガーメニューでサイドバーの開閉ができる", async ({
		page,
	}) => {
		await page.goto("./");

		// ハンバーガーメニューボタン
		const menuButton = page.getByLabel("メニュー");
		await expect(menuButton).toBeVisible();

		// サイドバーを開く
		await menuButton.click();
		const sidebar = page.locator("aside");
		await expect(sidebar).toBeVisible();

		// サイドバー内のリンクをクリックするとサイドバーが閉じる
		await sidebar
			.getByRole("link", { name: "フレンズステータスランキング" })
			.click();
		await page.waitForURL("**/friends-status");
	});
});
