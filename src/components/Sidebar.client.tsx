"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import Image from "next/image";
import { useSidebar } from "@/contexts/SidebarContext";
import { SidebarLinkItem } from "./Sidebar";
import CancelIcon from "@mui/icons-material/Cancel";
import { includesNormalizeQuery } from "@/utils/queryNormalizer";
import { NanodesuLink } from "@/components/common/NanodesuLink";
import { OwlIcon } from "@/components/OwlIcon";
import { useLinearNavigation } from "@/components/common/navigation/useLinearNavigation";

interface SidebarClientProps {
	sideBarLinksNanodesu: SidebarLinkItem[];
	sideBarLinksNanoda: SidebarLinkItem[];
	friendsLinks: SidebarLinkItem[];
	photoLinks: SidebarLinkItem[];
}

type SidebarNavigationKind = "nanodesu" | "nanoda" | "friend" | "photo";

type SidebarNavigationItem = SidebarLinkItem & {
	id: string;
	kind: SidebarNavigationKind;
};

function createNavigationItems(
	links: SidebarLinkItem[],
	kind: SidebarNavigationKind,
): SidebarNavigationItem[] {
	return links.map((link, index) => ({
		...link,
		id: `sidebar-${kind}-${index}`,
		kind,
	}));
}

export function SidebarClient({
	sideBarLinksNanodesu,
	sideBarLinksNanoda,
	friendsLinks,
	photoLinks,
}: SidebarClientProps) {
	const { isOpen, toggle, close } = useSidebar();
	const [searchQuery, setSearchQuery] = useState("");
	const searchInputRef = useRef<HTMLInputElement>(null);
	const isSearching = searchQuery.length > 0;

	const matchesSearch = useCallback(
		(link: SidebarLinkItem) =>
			includesNormalizeQuery(link.text, searchQuery) ||
			(link.textHiragana !== undefined &&
				includesNormalizeQuery(link.textHiragana, searchQuery)),
		[searchQuery],
	);

	const navigationItems = useMemo(
		() => [
			...createNavigationItems(sideBarLinksNanodesu, "nanodesu"),
			...createNavigationItems(sideBarLinksNanoda, "nanoda"),
			...(isSearching ? createNavigationItems(friendsLinks, "friend") : []),
			...(isSearching ? createNavigationItems(photoLinks, "photo") : []),
		],
		[isSearching, sideBarLinksNanodesu, sideBarLinksNanoda, friendsLinks, photoLinks],
	);
	const visibleNavigationItems = useMemo(
		() => navigationItems.filter(matchesSearch),
		[navigationItems, matchesSearch],
	);
	const visibleNanodesuLinks = visibleNavigationItems.filter(({ kind }) => kind === "nanodesu");
	const visibleNanodaLinks = visibleNavigationItems.filter(({ kind }) => kind === "nanoda");
	const visibleFriendsLinks = visibleNavigationItems.filter(({ kind }) => kind === "friend");
	const visiblePhotoLinks = visibleNavigationItems.filter(({ kind }) => kind === "photo");
	const navigation = useLinearNavigation({
		itemIds: visibleNavigationItems.map(({ id }) => id),
		autoSelectFirst: isSearching,
	});

	useEffect(() => {
		if (!navigation.activeId) return;
		const item = document.getElementById(navigation.activeId);
		item?.scrollIntoView({ block: "nearest" });

		if (document.activeElement?.closest("li[id^='sidebar-']")) {
			item?.querySelector<HTMLAnchorElement>("a")?.focus();
		}
	}, [navigation.activeId]);

	const handleSearchChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value;
			setSearchQuery(value);
			if (value === "") navigation.clearActive();
		},
		[navigation],
	);

	const handleSearchKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.nativeEvent.isComposing) return;

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					navigation.moveNext();
					break;
				case "ArrowUp":
					event.preventDefault();
					navigation.movePrevious();
					break;
				case "Enter": {
					const activeId = navigation.activateActive();
					if (!activeId) break;
					event.preventDefault();
					document
						.getElementById(activeId)
						?.querySelector<HTMLAnchorElement>("a")
						?.click();
					break;
				}
				case "Escape":
					if (searchQuery !== "") {
						event.preventDefault();
						setSearchQuery("");
						navigation.clearActive();
					}
					break;
			}
		},
		[navigation, searchQuery],
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				if (event.target === searchInputRef.current) return;
				if (isOpen) close();
				return;
			}

			if (!event.ctrlKey || event.key.toLowerCase() !== "k") return;

			event.preventDefault();
			if (!isOpen) toggle();
			requestAnimationFrame(() => searchInputRef.current?.focus());
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [close, isOpen, toggle]);

	const handleLinkKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLAnchorElement>) => {
			if (event.nativeEvent.isComposing) return;

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					navigation.moveNext();
					break;
				case "ArrowUp":
					event.preventDefault();
					navigation.movePrevious();
					break;
				case "Home":
					event.preventDefault();
					navigation.moveFirst();
					break;
				case "End":
					event.preventDefault();
					navigation.moveLast();
					break;
				case "Escape":
					event.preventDefault();
					searchInputRef.current?.focus();
					break;
			}
		},
		[navigation],
	);

	const renderNavigationItem = (item: SidebarNavigationItem) => {
		const className = `block hover:text-sky-500 rounded-sm hover:underline mb-1 leading-tight p-0.5 ${
			navigation.activeId === item.id ? "bg-sky-100 ring-2 ring-inset ring-sky-500" : ""
		}`;
		const commonProps = {
			href: item.href,
			className,
			onClick: close,
			onFocus: () => navigation.setActiveId(item.id),
			onKeyDown: handleLinkKeyDown,
		};

		return (
			<li key={item.id} id={item.id}>
				{item.kind === "nanodesu" ? (
					<NanodesuLink {...commonProps}>{item.text}</NanodesuLink>
				) : (
					<SeesaaWikiLink {...commonProps}>{item.text}</SeesaaWikiLink>
				)}
			</li>
		);
	};

	return (
		<aside
			className={`
			fixed md:sticky

			p-1 md:p-4
			m-3
			top-[63px] md:top-3
			left-0
			z-30 md:z-auto

			w-[18rem]
			h-[calc(100dvh-100px)] md:h-[calc(100dvh-30px)]
			shrink-0
			overflow-y-auto
			scrollbar-thin
			scrollbar-thumb-sky-200
			scrollbar-track-transparent
			hover:scrollbar-thumb-sky-300

			bg-[#f1f9fff4] md:bg-sky-50

			transform transition-transform duration-200 ease-in-out
			${isOpen ? "translate-x-0" : "-translate-x-[110%] md:translate-x-0"}

			rounded-lg
		`}
		>
			<nav className="space-y-1 p-4 md:p-0">
				{/* 検索窓 */}
				<div className="mb-4 relative">
					<input
						type="text"
						aria-label="ページを検索"
						placeholder="ページを検索..."
						value={searchQuery}
						onChange={handleSearchChange}
						onKeyDown={handleSearchKeyDown}
						className="w-full px-3 py-2 pr-20 bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
						ref={searchInputRef}
					/>
					{!searchQuery && (
						<kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
							Ctrl+K
						</kbd>
					)}
					{/* クリアボタン */}
					{searchQuery && (
						<button
							onClick={() => {
								setSearchQuery("");
								navigation.clearActive();
								searchInputRef.current?.focus();
							}}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							aria-label="検索をクリア"
						>
							<CancelIcon />
						</button>
					)}
				</div>

				{/* なのですトップページ */}
				<div className="flex justify-center items-center bg-sky-200 hover:bg-sky-300 hover:underline rounded-lg mb-2 transition-colors duration-200">
					<Image
						src="/wiki-nanodesu/no_blue.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-2 pr-1 w-[50px] h-[50px] flex-1"
					/>
					<NanodesuLink
						href="/"
						className="font-bold text-sky-700 p-2 pl-0 grow leading-tight"
						onClick={close}
					>
						アプリ版けものフレンズ３wikiなのです
						<OwlIcon />
					</NanodesuLink>
				</div>

				{/* なのですページリスト */}
				<ul className="list-disc pl-6">{visibleNanodesuLinks.map(renderNavigationItem)}</ul>

				{/* なのだページリスト */}
				<div className="flex justify-center items-center bg-green-200 hover:bg-green-300 hover:underline rounded-lg mb-2 transition-colors duration-200">
					<Image
						src="/wiki-nanodesu/no_green.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-2 pr-1 w-[50px] h-[50px] flex-1"
					/>
					<SeesaaWikiLink
						href="https://seesaawiki.jp/kemono_friends3_5ch/"
						className="font-bold text-green-700 p-2 pl-0 grow leading-tight"
						onClick={close}
					>
						アプリ版けものフレンズ３wikiなのだ！
					</SeesaaWikiLink>
				</div>

				{/* なのだページリスト */}
				<ul className="list-disc pl-6">{visibleNanodaLinks.map(renderNavigationItem)}</ul>

				{/* 検索時のみフレンズ名リストを表示 */}
				{isSearching && visibleFriendsLinks.length > 0 && (
					<div className="mt-4">
						<div className="flex items-center border-b-2 border-green-700 mb-2 font-bold text-green-700 grow mt-2">
							<div className="">フレンズ一覧</div>
						</div>
						<ul className="list-disc pl-6">
							{visibleFriendsLinks.map(renderNavigationItem)}
						</ul>
					</div>
				)}

				{/* 検索時のみフォトリストを表示 */}
				{isSearching && visiblePhotoLinks.length > 0 && (
					<div className="mt-4">
						<div className="flex items-center border-b-2 border-green-700 mb-2 font-bold text-green-700 grow mt-2">
							<div className="">フォト一覧</div>
						</div>
						<ul className="list-disc pl-6">
							{visiblePhotoLinks.map(renderNavigationItem)}
						</ul>
					</div>
				)}
			</nav>
		</aside>
	);
}
