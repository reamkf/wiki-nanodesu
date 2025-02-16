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

			w-[18rem]
			h-[24rem] md:h-auto
			flex-shrink-0

			bg-[#f1f9fff4] md:bg-sky-50

			transform transition-transform duration-300 ease-in-out
			${isOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}

			rounded-lg
		`}>
			<nav className="space-y-1 p-4 md:p-0">
				<div className="flex justify-center items-center block bg-green-200 hover:bg-green-300 hover:underline rounded-lg mb-2 transition-colors duration-200">
					<Image
						src="/wiki-nanodesu/no_green.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-3 pr-1 w-[80px] h-[80px] flex-1"
					/>
					<Link
						href="https://seesaawiki.jp/kemono_friends3_5ch/"
						className="font-bold text-green-700 p-3 pl-1 flex-grow"
						target="_blank"
						rel="noopener noreferrer"
						onClick={close}
					>
						アプリ版けものフレンズ３wikiなのだ！
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