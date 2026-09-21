import { test, expect, type Page, type Locator } from "@playwright/test";

// 表ヘッダー(グローバル検索+ページネーション)の配置仕様を検証するのです
// - 1行表示(MIN(ページ幅, 表の幅)が十分): 検索が左・ページネーションが右
// - 縦積み(幅不足): ページネーションが上・左揃え
// - いずれの場合もページネーションは表より右にはみ出さないのです

const PAGINATION_LABEL = "1ページあたり";
const SEARCH_INPUT_LABEL = "表全体を検索";
// はみ出し・整列の許容誤差(px)なのです
const OVERFLOW_TOLERANCE = 1;
const ALIGN_TOLERANCE = 2;
// 画面右端追従の許容誤差(px)なのです
// (レイアウトの余白・スクロールバー分のずれを許すのです)
const STICKY_TOLERANCE = 24;

interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
	right: number;
	bottom: number;
}

interface TableHeaderLayout {
	table: Box;
	header: Box;
	bottomWrap: Box;
	search: Box | null;
	paginations: Box[];
	singleLine: boolean;
	viewportWidth: number;
}

// 指定した表の配置情報を測るのです
async function getTableHeaderLayout(page: Page, table: Locator): Promise<TableHeaderLayout> {
	const handle = await table.elementHandle();
	if (!handle) {
		throw new Error("表が見つからないのです");
	}
	return page.evaluate(
		([t, searchLabel, paginationLabel]) => {
			const toBox = (r: DOMRect) => ({
				x: r.x,
				y: r.y,
				width: r.width,
				height: r.height,
				right: r.right,
				bottom: r.bottom,
			});
			// Tableコンポーネントのルートで範囲を絞るのです
			const root = (t as HTMLElement).parentElement as HTMLElement;
			const searchInput = root.querySelector(
				`input[aria-label="${searchLabel}"]`,
			) as HTMLElement | null;
			const labels = Array.from(root.querySelectorAll("span")).filter(
				(el) => el.textContent === paginationLabel,
			);
			const paginationOuters = labels.map((label) => {
				let node: HTMLElement | null = label as HTMLElement;
				while (node && !node.className.includes("overflow-x-auto")) {
					node = node.parentElement;
				}
				return node as HTMLElement;
			});
			// 検索と上部ページネーションが垂直方向に重なれば1行表示なのです
			// (CSSのflex-wrapによる配置を形状で判定するのです)
			const searchRect = searchInput?.getBoundingClientRect() ?? null;
			const topRect = paginationOuters[0]?.getBoundingClientRect() ?? null;
			const singleLine = !!(
				searchRect &&
				topRect &&
				searchRect.top < topRect.bottom - 1 &&
				topRect.top < searchRect.bottom - 1
			);
			return {
				table: toBox((t as HTMLElement).getBoundingClientRect()),
				header: toBox(
					(
						(t as HTMLElement).previousElementSibling as HTMLElement
					).getBoundingClientRect(),
				),
				bottomWrap: toBox(
					((t as HTMLElement).nextElementSibling as HTMLElement).getBoundingClientRect(),
				),
				search: searchInput ? toBox(searchInput.getBoundingClientRect()) : null,
				paginations: paginationOuters.map((node) => toBox(node.getBoundingClientRect())),
				singleLine,
				viewportWidth: window.innerWidth,
			};
		},
		[handle, SEARCH_INPUT_LABEL, PAGINATION_LABEL],
	);
}

// 表ヘッダーの配置仕様を検証するのです
async function expectTableHeaderLayout(
	page: Page,
	table: Locator,
	expected?: { singleLine?: boolean },
) {
	await expect(table).toBeVisible({ timeout: 15000 });
	// CSSのみで配置が決まるため追加の待機は不要なのです

	const layout = await getTableHeaderLayout(page, table);
	expect(layout.search, "グローバル検索が表示されるのです").not.toBeNull();
	expect(layout.paginations, "ページネーションが上下に表示されるのです").toHaveLength(2);

	const [top, bottom] = layout.paginations;
	const tableBox = layout.table;
	const search = layout.search as Box;

	// 検索・ページネーションは表の左右にはみ出さないのです
	expect(search.x).toBeGreaterThanOrEqual(tableBox.x - OVERFLOW_TOLERANCE);
	expect(search.right).toBeLessThanOrEqual(tableBox.right + OVERFLOW_TOLERANCE);
	expect(top.x).toBeGreaterThanOrEqual(tableBox.x - OVERFLOW_TOLERANCE);
	expect(top.right).toBeLessThanOrEqual(tableBox.right + OVERFLOW_TOLERANCE);
	expect(bottom.x).toBeGreaterThanOrEqual(tableBox.x - OVERFLOW_TOLERANCE);
	expect(bottom.right).toBeLessThanOrEqual(tableBox.right + OVERFLOW_TOLERANCE);
	// ヘッダー・下部全体は表幅いっぱいに広がるのです
	expect(Math.abs(layout.header.width - tableBox.width)).toBeLessThanOrEqual(ALIGN_TOLERANCE);
	expect(Math.abs(layout.bottomWrap.width - tableBox.width)).toBeLessThanOrEqual(ALIGN_TOLERANCE);

	if (expected?.singleLine !== undefined) {
		expect(layout.singleLine, "1行表示の有無が期待通りなのです").toBe(expected.singleLine);
	}

	if (layout.singleLine) {
		// 検索が左・ページネーションが右で1行に並ぶのです
		expect(search.right).toBeLessThanOrEqual(top.x + ALIGN_TOLERANCE);
		if (tableBox.right <= layout.viewportWidth + OVERFLOW_TOLERANCE) {
			// 表が画面に収まるとき上下のページネーションは表の右端まで届くのです
			expect(top.right).toBeGreaterThanOrEqual(tableBox.right - ALIGN_TOLERANCE);
			expect(bottom.right).toBeGreaterThanOrEqual(tableBox.right - ALIGN_TOLERANCE);
		} else {
			// 表が画面より広いとき上下のページネーションは画面右端に追従するのです
			// (余白・スクロールバー分のずれを許すのです)
			expect(top.right).toBeLessThanOrEqual(layout.viewportWidth + OVERFLOW_TOLERANCE);
			expect(top.right).toBeGreaterThanOrEqual(layout.viewportWidth - STICKY_TOLERANCE);
			expect(bottom.right).toBeLessThanOrEqual(layout.viewportWidth + OVERFLOW_TOLERANCE);
			expect(bottom.right).toBeGreaterThanOrEqual(layout.viewportWidth - STICKY_TOLERANCE);
		}
		// 上下のページネーションの右端が揃うのです
		expect(Math.abs(top.right - bottom.right)).toBeLessThanOrEqual(ALIGN_TOLERANCE);
	} else {
		// ページネーションが上で左揃えなのです
		expect(top.bottom).toBeLessThanOrEqual(search.y + ALIGN_TOLERANCE);
		expect(Math.abs(top.x - tableBox.x)).toBeLessThanOrEqual(ALIGN_TOLERANCE);
		expect(Math.abs(bottom.x - tableBox.x)).toBeLessThanOrEqual(ALIGN_TOLERANCE);
	}
}

// 直接表示される表を開くのです
async function openDirectTable(page: Page, url: string): Promise<Locator> {
	await page.goto(url);
	const table = page.locator("table").first();
	await expect(table).toBeVisible({ timeout: 15000 });
	return table;
}

// ハッシュで折りたたみを開いて表を出すのです
async function openFoldedTableByHash(page: Page, url: string): Promise<Locator> {
	await page.goto(url);
	const table = page.locator("table").first();
	await expect(async () => {
		await expect(table).toBeVisible({ timeout: 2000 });
	}).toPass({ timeout: 20000 });
	return table;
}

// 表を含む横スクロール部品を右へ動かすのです
async function scrollTableScrollerRight(
	page: Page,
	table: Locator,
	left: number,
): Promise<{ scrolled: boolean; scrollLeft: number }> {
	const handle = await table.elementHandle();
	if (!handle) {
		throw new Error("表が見つからないのです");
	}
	return page.evaluate(
		([t, x]) => {
			let node = (t as HTMLElement).parentElement;
			while (node) {
				const style = getComputedStyle(node);
				if (
					(style.overflowX === "auto" || style.overflowX === "scroll") &&
					node.scrollWidth > node.clientWidth + 10
				) {
					node.scrollLeft = x as number;
					return { scrolled: true, scrollLeft: node.scrollLeft };
				}
				node = node.parentElement;
			}
			return { scrolled: false, scrollLeft: 0 };
		},
		[handle, left],
	);
}

test.describe("表ヘッダーの配置", () => {
	test("フレンズステータスランキングは幅不足で縦積みになる", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		const table = await openDirectTable(page, "./friends-status");
		await expectTableHeaderLayout(page, table, { singleLine: false });
	});

	test("イベント一覧は幅が広いと1行表示になる", async ({ page }) => {
		await page.setViewportSize({ width: 1600, height: 900 });
		const table = await openDirectTable(page, "./event-list");
		await expectTableHeaderLayout(page, table, { singleLine: true });
	});

	test("イベント一覧は幅が狭いと縦積みになる", async ({ page }) => {
		await page.setViewportSize({ width: 500, height: 800 });
		const table = await openDirectTable(page, "./event-list");
		await expectTableHeaderLayout(page, table, { singleLine: false });
	});

	test("なないろとくせい一覧の表配置が仕様通り", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		const table = await openDirectTable(page, "./nanairo-skills");
		await expectTableHeaderLayout(page, table);
	});

	test("フォト火力ランキングはページ幅不足で縦積みになる", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		const table = await openDirectTable(page, "./photo-damage-ranking");
		await expectTableHeaderLayout(page, table, { singleLine: false });
	});

	test("スキル別フレンズ一覧の表配置が仕様通り", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		const table = await openFoldedTableByHash(page, "./friends-skills#Try!!与ダメージ増加");
		await expectTableHeaderLayout(page, table);
	});

	test("状態異常スキル一覧の表配置が仕様通り", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		const table = await openFoldedTableByHash(
			page,
			"./abnormal-status-skills#くらくら-friends-give",
		);
		await expectTableHeaderLayout(page, table);
	});

	test("画面幅が表の幅より広いときページネーションは表の右端に揃う", async ({ page }) => {
		await page.setViewportSize({ width: 1600, height: 900 });
		const table = await openDirectTable(page, "./nanairo-skills");
		await expectTableHeaderLayout(page, table);

		const layout = await getTableHeaderLayout(page, table);
		// 表が画面より十分狭いことが前提なのです
		expect(layout.table.right).toBeLessThan(layout.viewportWidth - 150);
		// ページネーションは画面右端ではなく表の右端に揃うのです
		for (const box of layout.paginations) {
			expect(Math.abs(box.right - layout.table.right)).toBeLessThanOrEqual(ALIGN_TOLERANCE);
		}
	});

	test("1行表示で表が画面より広いときページネーションは画面右端に追従する", async ({ page }) => {
		await page.setViewportSize({ width: 1600, height: 900 });
		const table = await openDirectTable(page, "./event-list");
		await expectTableHeaderLayout(page, table, { singleLine: true });

		const before = await getTableHeaderLayout(page, table);
		const viewportWidth = before.viewportWidth;
		// スクロール前から画面内に収まるのです
		for (const box of before.paginations) {
			expect(box.right).toBeLessThanOrEqual(viewportWidth + OVERFLOW_TOLERANCE);
		}

		// 右へスクロールするのです
		const scrolled = await scrollTableScrollerRight(page, table, 500);
		expect(scrolled.scrolled, "横スクロールするのです").toBe(true);
		const after = await getTableHeaderLayout(page, table);
		// 表自体は左へ動くのです
		expect(after.table.x).toBeLessThan(before.table.x);
		// ページネーションは画面右端に追従するのです
		for (const box of after.paginations) {
			expect(box.right).toBeLessThanOrEqual(viewportWidth + OVERFLOW_TOLERANCE);
			expect(box.right).toBeGreaterThanOrEqual(viewportWidth - STICKY_TOLERANCE);
		}
	});
});
