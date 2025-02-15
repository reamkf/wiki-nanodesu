'use client';

import React from 'react';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';

const sideBarLinks = [
	{
		href: '/',
		text: 'トップページ',
	},
	{
		href: '/friends-status',
		text: 'フレンズステータスランキング',
	},
];

export function Sidebar() {
	const { isOpen, close } = useSidebar();

	return (
		<aside className={`
			fixed md:sticky
			md:mr-8
			p-1 md:p-2
			m-2
			top-[63px] left-0
			h-[calc(100vh-63px)]
			bg-[#f1f9fff4] md:bg-sky-100
			w-64 md:w-[20rem]
			transform transition-transform duration-300 ease-in-out
			${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
			z-30 md:z-auto
			rounded-lg
			border-r
			border-sky-100
		`}>
			<nav className="space-y-1 p-4 md:p-0">
				<Link
					href="https://seesaawiki.jp/kemono_friends3_5ch/"
					className="block bg-green-100 hover:bg-green-200 rounded font-bold hover:underline text-green-500 border border-green-100 p-3 mb-2"
					onClick={close}
				>
					アプリ版けものフレンズ３Wikiなのだ！
				</Link>
				<ul className="list-disc pl-6">
					{sideBarLinks.map((link) => (
						<li key={link.href}>
							<Link
								href={link.href}
								className="block hover:text-sky-500 rounded hover:underline mb-1"
								onClick={close}
							>
								{link.text}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	);
}