import { test, expect } from "@playwright/test";
import { getCurrentSeasonCount, getDojoSeasonPageNames } from "../../src/utils/dojoSeason";
import { getWikiNanodaPageUrl } from "../../src/utils/wikiNanodaUrl";

test("道場の過去シーズンは道場またはどうじょ以降の検索で降順表示される", async ({ page }) => {
	await page.goto("./");
	const viewport = page.viewportSize();
	if (viewport && viewport.width < 768) {
		await page.getByLabel("メニュー").click();
	}

	const sidebar = page.locator("aside");
	const searchInput = sidebar.getByPlaceholder("ページを検索...");
	const dojoLinks = sidebar
		.locator('li[id^="sidebar-nanoda-"] a')
		.filter({ hasText: /^シーサーバル道場(?:（β2(?:-\d+)?）)?$/ });
	const seasonPages = getDojoSeasonPageNames(getCurrentSeasonCount());
	const latestSeasonPage = seasonPages[0];

	await expect(dojoLinks).toHaveText([latestSeasonPage]);
	await searchInput.fill("シーサー");
	await expect(dojoLinks).toHaveText([latestSeasonPage]);
	for (const query of ["ど", "どう", "どうじ", "シーサーバルどうじ"]) {
		await searchInput.fill(query);
		await expect(dojoLinks).toHaveText([latestSeasonPage]);
	}
	for (const query of ["どうじょ", "シーサーバルどうじょ"]) {
		await searchInput.fill(query);
		await expect(dojoLinks).toHaveText(seasonPages);
	}
	await searchInput.fill("どうじょう");
	await expect(dojoLinks).toHaveText(seasonPages);
	await searchInput.fill("道場");
	await expect(dojoLinks).toHaveText(seasonPages);
	await expect(
		sidebar.locator('li[id^="sidebar-nanoda-"] a').filter({ hasText: "道場" }),
	).toHaveText([
		"シーサーバル道場・概要",
		"シーサーバル道場・基本戦術",
		latestSeasonPage,
		"じょーとー獅子道場・概要",
		...seasonPages.slice(1),
	]);
	await searchInput.fill("シーサーバル道場");
	await expect(dojoLinks).toHaveText(seasonPages);
	await expect(dojoLinks.nth(-2)).toHaveAttribute(
		"href",
		getWikiNanodaPageUrl("シーサーバル道場（β2）"),
	);
	await expect(dojoLinks.last()).toHaveAttribute(
		"href",
		getWikiNanodaPageUrl("シーサーバル道場"),
	);

	await sidebar.getByLabel("検索をクリア").click();
	await expect(dojoLinks).toHaveText([latestSeasonPage]);
});
