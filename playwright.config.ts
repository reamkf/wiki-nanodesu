import { defineConfig, devices } from "@playwright/test";

/**
 * Next.js SSGでビルドされた静的ファイル（out/）をBun.serve()で配信してテストする設定
 *
 * basePath "/wiki-nanodesu" に対応するため、e2e/serve.ts のサーバーが
 * リクエストURLから /wiki-nanodesu プレフィックスを除去して out/ から配信する。
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	timeout: 30000,
	use: {
		baseURL: "http://localhost:3333/wiki-nanodesu/",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "mobile",
			use: { ...devices["Pixel 7"] },
		},
	],
	webServer: {
		command: "bun run serve",
		url: "http://localhost:3333/wiki-nanodesu",
		reuseExistingServer: !process.env.CI,
		timeout: 30000,
	},
	globalSetup: "./e2e/global-setup.ts",
});
