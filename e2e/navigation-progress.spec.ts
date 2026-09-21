import { test, expect } from "@playwright/test";

test.describe("ページプログレスバー", () => {
	/** プログレスバーのCSSが出力されるまで待つ (ハイドレーション待ちを兼ねるのです) */
	async function waitForProgressBarStyle(page: import("@playwright/test").Page) {
		await expect
			.poll(
				async () =>
					page.evaluate(() =>
						Array.from(document.querySelectorAll("style")).some((style) =>
							(style.textContent ?? "").includes("#nprogress"),
						),
					),
				{ timeout: 30000 },
			)
			.toBe(true);
	}

	test("ヘッダー下に表示するためのCSSが出力される", async ({ page }) => {
		await page.goto("./");
		await waitForProgressBarStyle(page);
		const hasHeaderOffset = await page.evaluate(() =>
			Array.from(document.querySelectorAll("style")).some((style) =>
				(style.textContent ?? "").includes("top: 63px"),
			),
		);
		expect(hasHeaderOffset).toBe(true);
	});

	test("内部リンク遷移でバーが表示され完了後に消える", async ({ page }) => {
		let appeared = false;
		// クリック検知リスナーはエフェクトで装着されるため、
		// 装着前のクリックで空振りしたら戻って再試行するのです
		for (let attempt = 0; attempt < 3 && !appeared; attempt++) {
			await page.goto("./");
			await waitForProgressBarStyle(page);
			// サイドバーは非同期で流れてくるためリンクの到着を待つのです
			const sidebarLink = page.locator('aside a[href$="/friends-status"]');
			await expect(sidebarLink).toBeAttached({ timeout: 30000 });
			// クリック検知リスナーはエフェクトで装着されるため描画を待つのです
			await page.evaluate(
				() =>
					new Promise((resolve) =>
						requestAnimationFrame(() => requestAnimationFrame(resolve)),
					),
			);
			appeared = await page.evaluate(() => {
				return new Promise<boolean>((resolve) => {
					const observer = new MutationObserver(() => {
						if (document.getElementById("nprogress")) {
							observer.disconnect();
							resolve(true);
						}
					});
					observer.observe(document.body, { childList: true, subtree: true });
					const link = document.querySelector('aside a[href$="/friends-status"]');
					if (!(link instanceof HTMLAnchorElement)) {
						observer.disconnect();
						resolve(false);
						return;
					}
					link.click();
					window.setTimeout(() => {
						observer.disconnect();
						resolve(document.getElementById("nprogress") !== null);
					}, 5000);
				});
			});
		}
		expect(appeared).toBe(true);
		await page.waitForURL("**/friends-status");
		await expect(page.locator("#nprogress")).toHaveCount(0);
	});
});
