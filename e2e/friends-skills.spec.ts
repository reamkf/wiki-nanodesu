import { test, expect } from "@playwright/test";

/** ツリー上のリーフ名＝CSVの効果種別。目次UIで枝が一意に定まるものを使う */
const FRIENDS_TOC_LEAF_ANCHOR = "Try!!与ダメージ増加";

test.describe("スキル別フレンズ一覧ページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./friends-skills");
	});

	test("ページタイトルが表示される", async ({ page }) => {
		await expect(
			page.locator("h2", { hasText: "スキル別フレンズ一覧" })
		).toBeVisible();
	});

	test("カテゴリセクションが表示される", async ({ page }) => {
		// カテゴリのヘッディングが存在する
		const categories = ["バフ", "デバフ", "たいりょく回復"];
		for (const category of categories) {
			await expect(
				page.getByText(category, { exact: true }).first()
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

		const headers = ["フレンズ", "属性", "わざ種別"];
		for (const header of headers) {
			await expect(
				table.locator("th", { hasText: header })
			).toBeVisible();
		}
	});

	test("説明テキストに状態異常スキルページへのリンクがある", async ({
		page,
	}) => {
		const link = page.getByRole("link", {
			name: /状態異常スキル一覧/,
		});
		await expect(link.first()).toBeVisible();
	});
});

test.describe("スキル別フレンズ一覧: 目次とURLハッシュ", () => {
	test("URLハッシュがリーフIDのとき、折りたたみが開きテーブルが表示される", async ({
		page,
	}) => {
		await page.goto(
			`./friends-skills#${encodeURIComponent(FRIENDS_TOC_LEAF_ANCHOR)}`
		);
		const table = page.locator("table").first();
		await expect(async () => {
			await expect(table).toBeVisible({ timeout: 2000 });
		}).toPass({ timeout: 15000 });
	});

	test("目次のリーフを選ぶと折りたたみが開きテーブルが表示される", async ({
		page,
	}) => {
		await page.goto("./friends-skills");
		await page.getByRole("button", { name: "目次" }).first().click();
		const dialogPanel = page.locator("[id^='headlessui-dialog-panel']");
		await expect(dialogPanel.getByPlaceholder("目次を検索...")).toBeVisible();
		await dialogPanel
			.getByPlaceholder("目次を検索...")
			.fill(FRIENDS_TOC_LEAF_ANCHOR);
		// MUI ListItemButton は aria-label が付かないため、表記テキストで辿る
		await dialogPanel
			.getByText(FRIENDS_TOC_LEAF_ANCHOR, { exact: true })
			.click();
		const table = page.locator("table").first();
		await expect(async () => {
			await expect(table).toBeVisible({ timeout: 2000 });
		}).toPass({ timeout: 15000 });
	});
});
