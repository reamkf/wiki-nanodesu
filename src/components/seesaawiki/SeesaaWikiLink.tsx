import Link, { LinkProps } from "next/link";
import { getWikiNanodaPageUrl } from "@/utils/encoding";
import { ReactNode } from "react";

// 子要素を受け入れるための型定義を追加
interface SeesaaWikiLinkProps extends LinkProps {
	children: ReactNode;
	className?: string;
}

export function SeesaaWikiLink(props: SeesaaWikiLinkProps) {
	const { children, ...restProps } = props;
	const href = props.href as string;

	if(!href.startsWith('https://')) {
		restProps.href = getWikiNanodaPageUrl(href);
	}

	return (
		<Link
			target="_blank"
			rel="noopener noreferrer"
			{...restProps}
		>
			{children}
		</Link>
	)
}
