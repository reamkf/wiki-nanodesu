'use client';

import React from 'react';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';

export function Sidebar() {
	const { isOpen, close } = useSidebar();

	return (
		<aside className={`
			fixed md:static
			top-[64px] left-0 h-full
			bg-white md:bg-transparent
			w-64 md:w-48
			transform transition-transform duration-300 ease-in-out
			${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
			z-30 md:z-auto
			border-r md:border-none
			mr-8
		`}>
			<nav className="space-y-2 p-4 md:p-0">
				<Link
					href="https://seesaawiki.jp/kemono_friends3_5ch/"
					className="block hover:bg-gray-100 rounded font-bold hover:underline text-green-500"
					onClick={close}
				>
					アプリ版けものフレンズ３Wikiなのだ！
				</Link>
				<Link
					href="/"
					className="block hover:bg-gray-100 rounded"
					onClick={close}
				>
					トップページ
				</Link>
				<Link
					href="/friends-status"
					className="block hover:bg-gray-100 rounded"
					onClick={close}
				>
					フレンズステータスランキング
				</Link>
			</nav>
		</aside>
	);
}