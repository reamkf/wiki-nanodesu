import React from 'react';
import Link from 'next/link';

export function Sidebar() {
	return (
		<aside className="w-48 mr-8">
			<nav className="space-y-2">
				<Link href="https://seesaawiki.jp/kemono_friends3_5ch/" className="block hover:bg-gray-100 rounded font-bold hover:underline text-green-500">アプリ版けものフレンズ３Wikiなのだ！</Link>
				<Link href="/" className="block hover:bg-gray-100 rounded">トップページ</Link>
				<Link href="/friends-status" className="block hover:bg-gray-100 rounded">フレンズステータスランキング</Link>
			</nav>
		</aside>
	);
}