"use client";

import NextTransitionBar from "next-transition-bar";
import type { JSX } from "react";

// ヘッダー(h-[63px])の高さなのです
const HEADER_HEIGHT_PX = 63;

// ライブラリ既定では画面最上端に固定表示されるため、
// ヘッダーの下に表示されるようCSSをずらすのです
function transformCSS(css: string): JSX.Element {
	return <style>{css.replace("top: 0;", `top: ${HEADER_HEIGHT_PX}px;`)}</style>;
}

export function NavigationProgressBar() {
	return (
		<NextTransitionBar
			color="#0284c7"
			height={3}
			showSpinner={false}
			shadow={false}
			transformCSS={transformCSS}
		/>
	);
}
