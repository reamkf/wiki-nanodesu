"use client";

import { useState } from "react";
import { AboutButton } from "@/components/AboutButton";
import { AboutModal } from "@/components/AboutModal";
import Image from "next/image";

export function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="bg-gradient-to-b from-sky-300 to-sky-200 text-white h-[63px] flex items-center">
			<div className="w-full px-2 mx-auto flex justify-between items-center max-w-7xl">
				<div className="flex items-center gap-2">
					<Image
						src="/no.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="sm:w-[60px] sm:h-[60px]"
					/>
					<h1 className="text-sm sm:text-xl font-bold text-sky-600 leading-tight">
						アプリ版けものフレンズ３wiki<br className="sm:hidden" />
						補佐なのです
					</h1>
				</div>
				<AboutButton onClick={() => setIsOpen(true)} />
			</div>
			<AboutModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</header>
	);
}
