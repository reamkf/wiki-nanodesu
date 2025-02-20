'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/contexts/SidebarContext';
import { SidebarLinkItem } from './Sidebar';

interface SidebarClientProps {
	sideBarLinksNanodesu: SidebarLinkItem[];
	sideBarLinksNanoda: SidebarLinkItem[];
}

export function SidebarClient({ sideBarLinksNanodesu, sideBarLinksNanoda }: SidebarClientProps) {
	const { isOpen, close } = useSidebar();
	const [searchQuery, setSearchQuery] = useState('');


	const filteredLinksNanodesu = sideBarLinksNanodesu.filter(link =>
		link.text.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const filteredLinksNanoda = sideBarLinksNanoda.filter(link =>
		link.text.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<aside className={`
			fixed md:sticky

			md:mr-4
			p-1 md:p-4
			m-2
			top-[63px] left-0
			z-30 md:z-auto

			w-[18rem]
			h-[calc(100vh-80px)]
			flex-shrink-0
			overflow-y-auto
			scrollbar-thin
			scrollbar-thumb-sky-200
			scrollbar-track-transparent
			hover:scrollbar-thumb-sky-300

			bg-[#f1f9fff4] md:bg-sky-50

			transform transition-transform duration-300 ease-in-out
			${isOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}

			rounded-lg
		`}>
			<nav className="space-y-1 p-4 md:p-0">
				<div className="mb-4">
					<input
						type="text"
						placeholder="ページを検索..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
					/>
				</div>

				<div className="flex justify-center items-center block bg-sky-200 hover:bg-sky-300 hover:underline rounded-lg mb-2 transition-colors duration-200">
					<Image
						src="/wiki-nanodesu/no_blue.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-3 pr-1 w-[70px] h-[70px] flex-1"
					/>
					<Link
						href="/"
						className="font-bold text-sky-700 p-3 pl-1 flex-grow"
						onClick={close}
					>
						アプリ版けものフレンズ３wikiなのです
					</Link>
				</div>
				<ul className="list-disc pl-6">
					{filteredLinksNanodesu.map((link) => (
						<li key={`nanodesu-${link.href}`}>
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
				<div className="flex justify-center items-center block bg-green-200 hover:bg-green-300 hover:underline rounded-lg mb-2 transition-colors duration-200">
					<Image
						src="/wiki-nanodesu/no_green.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-3 pr-1 w-[70px] h-[70px] flex-1"
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
					{filteredLinksNanoda.map((link) => (
						<li key={`nanoda-${link.href}`}>
							<Link
								href={link.href}
								className="block hover:text-sky-500 rounded hover:underline mb-1"
								onClick={close}
								target="_blank"
								rel="noopener noreferrer"
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