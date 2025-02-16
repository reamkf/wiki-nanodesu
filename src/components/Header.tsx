"use client";

import { useState } from "react";
import { AboutButton } from "@/components/AboutButton";
import { AboutModal } from "@/components/AboutModal";
import Image from "next/image";
import { useSidebar } from '@/contexts/SidebarContext';

export function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const { toggle, isOpen: isSidebarOpen } = useSidebar();

	return (
		<header className="bg-gradient-to-b from-sky-300 to-sky-200 text-white h-[63px]">
			<div className="w-full px-2 flex justify-between items-center max-w-7xl">
				<div className="flex items-center flex-1">
					<button
						className="md:hidden p-2 relative"
						onClick={toggle}
						aria-label="メニュー"
					>
						<div className="w-6 h-6 relative">
							<span className={`
								absolute left-0 w-6 h-0.5 bg-current transition-all duration-300
								${isSidebarOpen ? 'top-3 rotate-45' : 'top-1'}
							`}></span>
							<span className={`
								absolute left-0 top-3 w-6 h-0.5 bg-current transition-opacity duration-300
								${isSidebarOpen ? 'opacity-0' : 'opacity-100'}
							`}></span>
							<span className={`
								absolute left-0 w-6 h-0.5 bg-current transition-all duration-300
								${isSidebarOpen ? 'top-3 -rotate-45' : 'top-5'}
							`}></span>
						</div>
					</button>
					<Image
						src="https://reamkf.github.io/wiki-nanodesu/no_blue.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="sm:w-[60px] sm:h-[60px]"
					/>
					<h1 className="text-sm sm:text-xl font-bold text-sky-600 leading-tight pl-1">
						アプリ版けものフレンズ３wiki<br className="sm:hidden" />
						なのです🦉
					</h1>
				</div>
				<AboutButton onClick={() => setIsOpen(true)} />
			</div>
			<AboutModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</header>
	);
}
