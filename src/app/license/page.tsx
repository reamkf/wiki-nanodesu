import path from 'node:path';
import fs from 'node:fs/promises';
import { Heading } from '@/components/section/Heading';

// license-checker の出力の一部のみ使用する
interface LicenseInfo {
	licenses: string | string[];
	repository?: string;
	publisher?: string;
	email?: string;
	url?: string;
	licenseText?: string;
	licenseFile?: string;
}

interface LicenseEntry {
	name: string;
	licenses: string;
	repository?: string;
	publisher?: string;
	email?: string;
	licenseText?: string;
}

async function readLicenses(): Promise<LicenseEntry[]> {
	const filePath = path.join(process.cwd(), 'public', 'third-party-licenses.json');
	let rawJson = '{}';
	try {
		rawJson = await fs.readFile(filePath, 'utf8');
	} catch {
		return [];
	}
	let parsed: Record<string, LicenseInfo> = {};
	try {
		parsed = JSON.parse(rawJson) as Record<string, LicenseInfo>;
	} catch {
		return [];
	}
	return Object.entries(parsed)
		.map(([pkg, info]) => ({
			name: pkg,
			licenses: Array.isArray(info.licenses) ? info.licenses.join(', ') : info.licenses,
			repository: info.repository || info.url,
			publisher: info.publisher,
			email: info.email,
			licenseText: info.licenseText,
		}))
		.filter((entry) => !(entry.name === 'wiki-nanodesu' || entry.name.startsWith('wiki-nanodesu@')))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export default async function Page() {
	const licenses = await readLicenses();
	return (
		<>
			<Heading title="免責事項" id="disclaimer" level={2}/>
			<p className="mb-4">
				当サイトは有志による非公式サイトであり、公式(「けものフレンズプロジェクト２Ｇ」及び「SEGA」「アピリッツ」又はその関連団体)とは一切関係ありません。記載内容について公式への問い合わせはご遠慮ください。
				<br/>
				当サイトに掲載されている内容の正確性に関して保証しません。
				当サイトを利用して発生した如何なる損害に関しても、当サイトは責任を負いません。<br/>
				当サイトに掲載されている攻略、データ類の無断使用・無断転載は固くお断りします。<br/><br/>

				本免責事項及びサイトの掲載情報は、予告なく変更または削除される場合があります。
			</p>

			<Heading title="ゲーム内画像等について" id="license-image" level={2}/>
			<p className="mb-4">
				ゲーム内、<a href="https://x.com/kemono_friends3" target="_blank" rel="noopener noreferrer">公式X</a>または<a href="https://kemono-friends-3.jp" target="_blank" rel="noopener noreferrer">公式サイト</a>に由来する画像・文章等の著作権は、「けものフレンズプロジェクト２Ｇ」及び「SEGA」「アピリッツ」又はその関連団体に帰属します。<br />
				フレンズの属性アイコンは <a href="https://github.com/nanase/kf-assets" className="text-blue-600 underline break-words break-all" target="_blank" rel="noopener noreferrer">nanase/kf-assets</a> を使用しています。
				<br/>
				画像の転載・流用や、著作権者様へのお問い合わせはお控え下さい。
			</p>

			<Heading title="オープンソースライセンス" id="open-source-licenses" level={2}/>
			<p className="text-sm text-gray-600 mb-4">
				当サイトで使用しているオープンソースソフトウェアのライセンス一覧です。
			</p>
			{licenses.length === 0 ? (
				<p className="text-sm">ライセンス情報が見つからないのです。先にスクリプトで生成するのです。</p>
			) : (
				<ul className="space-y-3">
					{licenses.map((item) => (
						<li key={item.name} className="border rounded-md p-3 bg-white">
							<div className="font-medium whitespace-pre-wrap break-words">
								{item.repository ? (
									<a href={item.repository} target="_blank" rel="noreferrer" className="text-blue-600 underline break-words break-all">
										{item.name}
									</a>
								) : (
									item.name
								)}
							</div>
							<div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap break-words">License: {item.licenses}</div>
							{item.licenseText ? (
								<details className="mt-2">
									<summary className="cursor-pointer text-xs text-blue-600 underline">ライセンス全文を表示</summary>
									<pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words p-2 bg-gray-50 border rounded text-[11px] leading-4">
										{item.licenseText}
									</pre>
								</details>
							) : null}
						</li>
					))}
				</ul>
			)}
		</>
	);
}
