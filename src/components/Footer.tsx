import Link from 'next/link';

export function Footer() {
	return (
		<footer>
			<div className="flex flex-col items-center justify-center my-8">
				<p className="text-xs text-gray-400 max-w-[90vw]">
					ゲーム内や公式Twitterからの画像・文章等の著作権等は「けものフレンズプロジェクト２Ｇ」及び「SEGA」「アピリッツ」又はその関連団体に帰属します。
				</p>
				<p className="text-sm text-gray-500 mt-4">
					<Link href="/">アプリ版けものフレンズ３wikiなのです🦉</Link>
				</p>
			</div>
		</footer>
	);
}
