"use client";

import { useState } from "react";
import { AboutButton } from "@/components/about/AboutButton";
import { AboutModal } from "@/components/about/AboutModal";
import Image from "next/image";
import { useSidebar } from '@/contexts/SidebarContext';
import { OwlIcon } from "@/components/OwlIcon";

export function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const { toggle, isOpen: isSidebarOpen } = useSidebar();

	function sidebarButton() {
		return (
			<button
				className="md:hidden px-2 relative"
				onClick={toggle}
				aria-label="メニュー"
			>
				<div className="w-6 h-6 relative">
					<span className={`
						absolute left-0 w-6 h-0.5 bg-current transition-all duration-200
						${isSidebarOpen ? 'top-3 rotate-45' : 'top-1'}
					`}></span>
					<span className={`
						absolute left-0 top-3 w-6 h-0.5 bg-current transition-opacity duration-200
						${isSidebarOpen ? 'opacity-0' : 'opacity-100'}
					`}></span>
					<span className={`
						absolute left-0 w-6 h-0.5 bg-current transition-all duration-200
						${isSidebarOpen ? 'top-3 -rotate-45' : 'top-5'}
					`}></span>
				</div>
			</button>
		);
	}

	return (
		<header className="bg-linear-to-b from-sky-300 to-sky-200 text-white h-[63px]">
			<div className="w-full h-full px-2 flex justify-between md:justify-start items-center">
				<div className="flex items-center">
					{sidebarButton()}
					<Image
						src="/wiki-nanodesu/no_blue.png"
						alt="「の」のアイコン"
						width={55}
						height={55}
						className="w-[55px] h-[55px]"
					/>
					<h1 className="text-md sm:text-xl font-bold text-sky-600 leading-tight pl-1">
						アプリ版けものフレンズ３<br className="sm:hidden" />wikiなのです<OwlIcon />
					</h1>
				</div>
				<AboutButton onClick={() => setIsOpen(true)} />
			</div>
			<AboutModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</header>
	);
}
