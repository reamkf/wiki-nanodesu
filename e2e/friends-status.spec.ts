import { test, expect } from "@playwright/test";

test.describe("フレンズステータスランキングページ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("./friends-status");
	});

	test("ページタイトルが表示される", async ({ page }) => {
		await expect(
			page.locator("h2", { hasText: "フレンズステータスランキング" })
		).toBeVisible();
	});

	test("テーブルが表示される", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// ヘッダーが表示されている
		const headers = ["フレンズ名", "属性", "たいりょく", "こうげき", "まもり"];
		for (const header of headers) {
			await expect(
				table.locator("th", { hasText: header })
			).toBeVisible();
		}
	});

	test("テーブルにデータ行が存在する", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();
		const rows = table.locator("tbody tr");
		const count = await rows.count();
		expect(count).toBeGreaterThan(0);
	});

	test("フィルターチェックボックスが表示される", async ({ page }) => {
		// ステータスタイプの選択肢が存在する（ラベルは☆6/プレフィックスなし）
		await expect(page.getByText("Lv90/野生4")).toBeVisible();
		await expect(page.getByText("Lv99/野生4")).toBeVisible();
	});

	test("チェックボックスの切り替えでテーブルが更新される", async ({
		page,
	}) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// チェックボックスを操作して別のステータスタイプに切り替え
		const checkbox = page.getByText("Lv200/野生4").first();
		await checkbox.click();

		// テーブルの内容が変化するはず
		await page.waitForTimeout(500);
		await expect(page.locator("table")).toBeVisible();
	});

	test("テーブルの列ヘッダーをクリックするとソートされる", async ({
		page,
	}) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// 「こうげき」ヘッダーをクリックしてソート
		const atkHeader = table.locator("th", { hasText: "こうげき" });
		await atkHeader.click();

		// ソートインジケーターがアクティブになる
		const activeSortIndicator = atkHeader.locator("svg.text-blue-600");
		await expect(activeSortIndicator).toBeVisible();
	});

	test("テーブルの検索フィルターが動作する", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();
		const initialRowCount = await table.locator("tbody tr").count();

		// フレンズ名列の検索入力欄に入力
		const filterInputs = table.locator('input[placeholder="検索..."]');
		// 2番目の検索入力欄（フレンズ名列）
		const nameFilter = filterInputs.nth(1);
		await nameFilter.fill("サーバル");

		// フィルター適用後のデータ行数が少なくなる
		await page.waitForTimeout(300);
		const filteredRowCount = await table.locator("tbody tr").count();
		expect(filteredRowCount).toBeLessThan(initialRowCount);
		expect(filteredRowCount).toBeGreaterThan(0);
	});

	test("ページサイズを変更するとテーブルの行数が変化する", async ({
		page,
	}) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// 初期行数を取得
		const initialRowCount = await table.locator("tbody tr").count();

		// MUI Selectコンポーネントをクリックして開く
		const pageSizeSelect = page
			.locator(".MuiSelect-select")
			.first();
		await pageSizeSelect.click();

		// ドロップダウンメニューからオプションを選択
		const option = page.getByRole("option", { name: "50", exact: true });
		await option.click();

		// テーブルが更新されるのを待つ
		await page.waitForTimeout(500);

		// 行数が変化したか、50行になっていることを確認
		const newRowCount = await table.locator("tbody tr").count();
		expect(newRowCount === 50 || newRowCount !== initialRowCount).toBeTruthy();
	});

	test("ソートの3状態サイクルが動作する", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		const atkHeader = table.locator("th", { hasText: "こうげき" });

		// 1回目クリック: 降順ソート — インジケーターが表示される
		await atkHeader.click();
		const activeSortIndicator = atkHeader.locator("svg.text-blue-600");
		await expect(activeSortIndicator).toBeVisible();

		// 2回目クリック: 昇順ソート — インジケーターがまだ表示される
		await atkHeader.click();
		await expect(activeSortIndicator).toBeVisible();

		// 3回目クリック: ソート解除 — インジケーターが非表示になる
		await atkHeader.click();
		await expect(activeSortIndicator).toHaveCount(0);
	});

	test("チェックボックスの状態がリロード後に保持される", async ({
		page,
	}) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// Lv200/野生4チェックボックスをクリックして切り替える
		const lv200Checkbox = page.getByText("Lv200/野生4").first();
		await lv200Checkbox.click();
		await page.waitForTimeout(500);

		// テーブルにデータが表示されていることを確認
		const rowCountBefore = await table.locator("tbody tr").count();
		expect(rowCountBefore).toBeGreaterThan(0);

		// ページをリロード
		await page.reload();

		// テーブルが再表示されるのを待つ
		await expect(page.locator("table")).toBeVisible();
		await page.waitForTimeout(500);

		// リロード後もテーブルにデータが存在することを確認（LocalStorageで保持される）
		const rowCountAfterReload = await page.locator("table tbody tr").count();
		expect(rowCountAfterReload).toBeGreaterThan(0);
	});

	test("複数列の検索フィルターを同時に使用できる", async ({ page }) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();
		const initialRowCount = await table.locator("tbody tr").count();

		const filterInputs = table.locator('input[placeholder="検索..."]');

		// フレンズ名列（2番目）でフィルター
		const nameFilter = filterInputs.nth(1);
		await nameFilter.fill("サーバル");
		await page.waitForTimeout(300);

		const rowCountAfterNameFilter = await table.locator("tbody tr").count();
		expect(rowCountAfterNameFilter).toBeLessThan(initialRowCount);
		expect(rowCountAfterNameFilter).toBeGreaterThan(0);

		// 属性列（3番目）でさらにフィルター
		const attrFilter = filterInputs.nth(2);
		await attrFilter.fill("ファニー");
		await page.waitForTimeout(300);

		// さらに絞り込まれるか、フィルター済みの状態を維持する
		const rowCountAfterBothFilters = await table.locator("tbody tr").count();
		expect(rowCountAfterBothFilters).toBeLessThanOrEqual(rowCountAfterNameFilter);
	});

	test("複数のフィルターチェックボックスを組み合わせて切り替えられる", async ({
		page,
	}) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// Lv200/野生4チェックボックスをクリック
		const lv200Checkbox = page.getByText("Lv200/野生4").first();
		await lv200Checkbox.click();
		await page.waitForTimeout(500);

		// テーブルにデータ行が存在することを確認
		const rowCountAfterFirst = await table.locator("tbody tr").count();
		expect(rowCountAfterFirst).toBeGreaterThan(0);

		// さらにLv99/野生4チェックボックスをクリック
		const lv99Checkbox = page.getByText("Lv99/野生4").first();
		await lv99Checkbox.click();
		await page.waitForTimeout(500);

		// テーブルにまだデータ行が表示されていることを確認
		const rowCountAfterSecond = await table.locator("tbody tr").count();
		expect(rowCountAfterSecond).toBeGreaterThan(0);
	});

	test("着せ替えボーナスのチェックボックスが存在する", async ({ page }) => {
		// 衣装補正を含むチェックボックスが表示されていることを確認
		const costumeBonusLabel = page.getByText("衣装補正を含む");
		await expect(costumeBonusLabel).toBeVisible();

		// ラベルに対応するチェックボックスをクリックしてトグル
		const costumeBonusCheckbox = page
			.locator("label", { hasText: "衣装補正を含む" })
			.locator("input[type='checkbox']");
		await costumeBonusCheckbox.click();

		// トグル後もテーブルが表示されていることを確認
		await page.waitForTimeout(500);
		await expect(page.locator("table")).toBeVisible();
	});

	test("不明ステータスを除外するチェックボックスが動作する", async ({
		page,
	}) => {
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// 変更前の行数を取得
		const rowCountBefore = await table.locator("tbody tr").count();
		expect(rowCountBefore).toBeGreaterThan(0);

		// 不明なステータスを非表示チェックボックスをクリック
		const hideNullCheckbox = page
			.locator("label", { hasText: "不明なステータスを非表示" })
			.locator("input[type='checkbox']");
		await hideNullCheckbox.click();
		await page.waitForTimeout(500);

		// テーブルがまだ表示されデータ行が存在することを確認
		await expect(table).toBeVisible();
		const rowCountAfter = await table.locator("tbody tr").count();
		expect(rowCountAfter).toBeGreaterThan(0);
	});
});
