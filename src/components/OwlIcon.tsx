"use client";
import Image from "next/image";

export function OwlIcon() {
	return (
		<>
			<Image
				draggable="false"
				className="ext-emoji"
				alt="フクロウ"
				src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f989.svg"
				width={20} height={20}
			/>
		</>
	);
}
