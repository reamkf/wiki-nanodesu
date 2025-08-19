import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

interface LicenseInfo {
	licenses?: string | string[];
	licenseFile?: string;
	licenseText?: string;
	repository?: string;
	publisher?: string;
	email?: string;
	url?: string;
	[key: string]: unknown;
}

interface LicenseCheckerOptions {
	start: string;
	production: boolean;
	relativeLicensePath: boolean;
}

interface LicenseCheckerModule {
	init: (
		options: LicenseCheckerOptions,
		cb: (err: Error | null, json: Record<string, LicenseInfo>) => void
	) => void;
}

async function collectLicenses(): Promise<Record<string, LicenseInfo>> {
	const checker = require('license-checker-rseidelsohn') as LicenseCheckerModule;
	return await new Promise<Record<string, LicenseInfo>>((resolve, reject) => {
		checker.init(
			{
				start: process.cwd(),
				production: true,
				relativeLicensePath: true,
			},
			(err, json) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(json);
			}
		);
	});
}

async function enrichWithTexts(data: Record<string, LicenseInfo>): Promise<Record<string, LicenseInfo>> {
	const entries = Object.entries(data);
	for (const [, info] of entries) {
		if (!info) continue;
		if (!info.licenseText && info.licenseFile) {
			try {
				const filePath = path.isAbsolute(info.licenseFile)
					? info.licenseFile
					: path.join(process.cwd(), info.licenseFile);
				const text = await fs.readFile(filePath, 'utf8');
				info.licenseText = text;
			} catch {
				// 読み取り不可の場合はスキップ
			}
		}
	}
	return data;
}

async function main(): Promise<void> {
	const data = await collectLicenses();
	const enriched = await enrichWithTexts(data);
	const outPath = path.join(process.cwd(), 'public', 'third-party-licenses.json');
	await fs.mkdir(path.dirname(outPath), { recursive: true });
	await fs.writeFile(outPath, JSON.stringify(enriched, null, 2), 'utf8');
	console.log('Wrote', outPath);
}

main().catch(() => {
	process.exit(1);
});
