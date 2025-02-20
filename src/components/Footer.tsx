import Link from 'next/link';
import { GitHub } from '@mui/icons-material';

export function Footer() {
	return (
		<footer>
			<div className="flex flex-col items-center justify-center my-8">
				<p className="text-xs text-gray-400 max-w-[90%] text-center">
					ゲーム内や公式Twitterからの画像・文章等の著作権等は「けものフレンズプロジェクト２Ｇ」及び「SEGA」「アピリッツ」又はその関連団体に帰属します。
				</p>
				<div className="flex gap-2 text-sm text-gray-500 mt-4 items-center">
					<Link href="/">アプリ版けものフレンズ３wikiなのです🦉</Link>
					<Link
						href="https://github.com/reamkf/wiki-nanodesu" target="_blank" rel="noopener noreferrer"
						className="flex items-center gap-1"
					>
						<GitHub className="w-5 h-5 text-[#202328]" sx={{ height: '1.2rem' }} />
					</Link>
				</div>
			</div>
		</footer>
	);
}
