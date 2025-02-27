'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { SeesaaWikiLink } from '@/components/seesaawiki/SeesaaWikiLink';
import Image from 'next/image';
import { useSidebar } from '@/contexts/SidebarContext';
import { SidebarLinkItem } from './Sidebar';
import CancelIcon from '@mui/icons-material/Cancel';
import { normalizeQuery } from '@/utils/queryNormalizer';

interface SidebarClientProps {
	sideBarLinksNanodesu: SidebarLinkItem[];
	sideBarLinksNanoda: SidebarLinkItem[];
	friendsLinks: SidebarLinkItem[];
	photoLinks: SidebarLinkItem[];
}

export function SidebarClient({ sideBarLinksNanodesu, sideBarLinksNanoda, friendsLinks, photoLinks }: SidebarClientProps) {
	const { isOpen, close } = useSidebar();
	const [searchQuery, setSearchQuery] = useState('');
	const searchInputRef = useRef<HTMLInputElement>(null);

	const filteredLinksNanodesu = sideBarLinksNanodesu.filter(link =>
		normalizeQuery(link.text).includes(normalizeQuery(searchQuery))
	);

	const filteredLinksNanoda = sideBarLinksNanoda.filter(link =>
		normalizeQuery(link.text).includes(normalizeQuery(searchQuery))
	);

	const filteredFriendsLinks = friendsLinks.filter(link =>
		normalizeQuery(link.text).includes(normalizeQuery(searchQuery))
	);

	const filteredPhotoLinks = photoLinks.filter(link =>
		normalizeQuery(link.text).includes(normalizeQuery(searchQuery))
	);

	return (
		<aside className={`
			fixed md:sticky

			p-1 md:p-4
			m-3
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
				<div className="mb-4 relative">
					<input
						type="text"
						placeholder="ページを検索..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
						ref={searchInputRef}
					/>
					{searchQuery && (
						<button
							onClick={() => {
								setSearchQuery('');
								searchInputRef.current?.focus();
							}}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							aria-label="検索をクリア"
						>
							<CancelIcon />
						</button>
					)}
				</div>

				<div className="flex justify-center items-center block bg-sky-200 hover:bg-sky-300 hover:underline rounded-lg mb-2 transition-colors duration-200">
					<Image
						src="/wiki-nanodesu/no_blue.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-2 pr-1 w-[50px] h-[50px] flex-1"
					/>
					<Link
						href="/"
						className="font-bold text-sky-700 p-2 pl-0 flex-grow leading-tight"
						onClick={close}
					>
						アプリ版けものフレンズ３wikiなのです🦉
					</Link>
				</div>
				<ul className="list-disc pl-6">
					{filteredLinksNanodesu.map((link) => (
						<li key={`nanodesu-${link.href}`}>
							<Link
								href={link.href}
								className="block hover:text-sky-500 rounded hover:underline mb-1 leading-tight"
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
						className="p-2 pr-1 w-[50px] h-[50px] flex-1"
					/>
					<SeesaaWikiLink
						href="https://seesaawiki.jp/kemono_friends3_5ch/"
						className="font-bold text-green-700 p-2 pl-0 flex-grow leading-tight"
						onClick={close}
					>
						アプリ版けものフレンズ３wikiなのだ！
					</SeesaaWikiLink>
				</div>
				<ul className="list-disc pl-6">
					{filteredLinksNanoda.map((link) => (
						<li key={`nanoda-${link.href}`}>
							<SeesaaWikiLink
								href={link.href}
								className="block hover:text-sky-500 rounded hover:underline mb-1 leading-tight"
								onClick={close}
							>
								{link.text}
							</SeesaaWikiLink>
						</li>
					))}
				</ul>

				{/* 検索時のみフレンズ名リストを表示 */}
				{searchQuery && filteredFriendsLinks.length > 0 && (
					<div className="mt-4">
						<div className="flex items-center block border-b-2 border-green-700 mb-2 font-bold text-green-700 flex-grow mt-2">
							<div className="">
								フレンズ一覧
							</div>
						</div>
						<ul className="list-disc pl-6">
							{filteredFriendsLinks.map((link) => (
								<li key={`friend-${link.href}`}>
									<SeesaaWikiLink
										href={link.href}
										className="block hover:text-sky-500 rounded hover:underline mb-1 leading-tight"
										onClick={close}
									>
										{link.text}
									</SeesaaWikiLink>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* 検索時のみフォトリストを表示 */}
				{searchQuery && filteredPhotoLinks.length > 0 && (
					<div className="mt-4">
						<div className="flex items-center block border-b-2 border-green-700 mb-2 font-bold text-green-700 flex-grow mt-2">
							<div className="">
								フォト一覧
							</div>
						</div>
						<ul className="list-disc pl-6">
							{filteredPhotoLinks.map((link) => (
								<li key={`photo-${link.href}`}>
									<SeesaaWikiLink
										href={link.href}
										className="block hover:text-sky-500 rounded hover:underline mb-1 leading-tight"
										onClick={close}
									>
										{link.text}
									</SeesaaWikiLink>
								</li>
							))}
						</ul>
					</div>
				)}
			</nav>
		</aside>
	);
}