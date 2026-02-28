import Link from 'next/link';
import GitHub from '@mui/icons-material/GitHub';
import { OwlIcon } from '@/components/OwlIcon';
export function Footer() {
	return (
		<footer>
			<div className="flex flex-col items-center justify-center my-8">
				<p className="text-xs text-gray-400 max-w-[90%] text-center">
					ゲーム内、<a href="https://x.com/kemono_friends3" target="_blank" rel="noopener noreferrer">公式X</a>または<a href="https://kemono-friends-3.jp" target="_blank" rel="noopener noreferrer">公式サイト</a>に由来する画像・文章等の著作権は、「けものフレンズプロジェクト２Ｇ」及び「SEGA」「アピリッツ」又はその関連団体に帰属します。
				</p>
				<div className="flex gap-2 text-sm text-gray-500 mt-4 items-center">
					<Link href="/">アプリ版けものフレンズ３wikiなのです<OwlIcon /></Link>
					<Link href="/license">License</Link>
					<Link
						href="https://github.com/reamkf/wiki-nanodesu"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1"
					>
						<GitHub className="w-5 h-5 text-[#202328]" />
					</Link>
				</div>
			</div>
		</footer>
	);
}
