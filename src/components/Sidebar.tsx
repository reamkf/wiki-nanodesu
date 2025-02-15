'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

			md:mr-4
			p-1 md:p-4
			m-2
			top-[63px] left-0
			z-30 md:z-auto

			w-64 md:w-[18rem]
			h-[24rem] md:h-auto

			bg-[#f1f9fff4] md:bg-sky-50

			transform transition-transform duration-300 ease-in-out
			${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}

			rounded-lg
		`}>
			<nav className="space-y-1 p-4 md:p-0">
				<div className="flex justify-center items-center block bg-green-200 hover:bg-green-300 rounded-lg mb-2">
					<Image
						src="/no_green.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-3 pr-1 sm:w-[84px] sm:h-[84px]"
					/>
					<Link
						href="https://seesaawiki.jp/kemono_friends3_5ch/"
						className="font-bold hover:underline text-green-700 p-3 pl-1"
						onClick={close}
					>
						アプリ版けものフレンズ３Wikiなのだ！
					</Link>
				</div>
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