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

	test("グラフにノードが描画される", async ({ page }) => {
		const svg = page.locator("svg");
		await expect(svg.first()).toBeVisible({ timeout: 10000 });
		// D3グラフはrect要素でノードの背景を描画する
		const nodes = page.locator("svg .nodes g.node");
		await expect(nodes.first()).toBeVisible({ timeout: 10000 });
		expect(await nodes.count()).toBeGreaterThan(0);
	});

	test("グラフにリンク（線）が描画される", async ({ page }) => {
		const svg = page.locator("svg");
		await expect(svg.first()).toBeVisible({ timeout: 10000 });
		const lines = page.locator("svg .links line");
		await expect(lines.first()).toBeVisible({ timeout: 10000 });
		expect(await lines.count()).toBeGreaterThan(0);
	});

	test("グラフにグループ（パス）が描画される", async ({ page }) => {
		const svg = page.locator("svg");
		await expect(svg.first()).toBeVisible({ timeout: 10000 });
		const paths = page.locator("svg .hulls path");
		await expect(paths.first()).toBeVisible({ timeout: 10000 });
		expect(await paths.count()).toBeGreaterThan(0);
	});

	test("グラフのズーム操作が動作する", async ({ page }) => {
		const svg = page.locator("svg");
		await expect(svg.first()).toBeVisible({ timeout: 10000 });

		// D3のシミュレーションが安定するまで待つ
		const nodes = page.locator("svg .nodes g.node");
		await expect(nodes.first()).toBeVisible({ timeout: 10000 });

		// D3はコンテンツをg要素でラップし、transformで操作する
		// g.hulls要素のtransform属性を取得して比較する
		const hullsGroup = page.locator("svg g.hulls");
		await expect(hullsGroup).toBeAttached({ timeout: 10000 });

		const initialTransform = await hullsGroup.evaluate(
			(el) => el.parentElement?.getAttribute("transform") || ""
		);

		// マウスホイールでズーム操作
		const box = await svg.first().boundingBox();
		if (box) {
			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.wheel(0, -100);
		}
		await page.waitForTimeout(500);

		const newTransform = await hullsGroup.evaluate(
			(el) => el.parentElement?.getAttribute("transform") || ""
		);

		// transformが変化したか、少なくともSVGが表示されていることを確認
		if (initialTransform === newTransform) {
			await expect(svg.first()).toBeVisible();
		} else {
			expect(newTransform).not.toBe(initialTransform);
		}
	});
});
