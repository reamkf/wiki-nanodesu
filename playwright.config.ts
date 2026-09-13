import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const port = isCI ? 3333 : 3000;

/**
 * ローカルではNext.jsの開発サーバーを、CIではビルド済みの静的ファイルを配信してテストする設定。
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
		baseURL: `http://localhost:${port}/wiki-nanodesu/`,
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
		command: isCI ? "bun run serve" : "bun run dev",
		url: `http://localhost:${port}/wiki-nanodesu`,
		reuseExistingServer: !isCI,
		timeout: 30000,
	},
	globalSetup: isCI ? "./e2e/global-setup.ts" : undefined,
});
