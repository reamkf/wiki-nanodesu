import Link, { LinkProps } from "next/link";
import { getWikiNanodaPageUrl } from '@/utils/seesaawiki/encoding';
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
			className={'font-bold text-green-500' + ' ' + (props.className || '')}
			target="_blank"
			rel="noopener noreferrer"
			{...restProps}
		>
			{children}
		</Link>
	)
}
