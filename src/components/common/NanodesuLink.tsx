import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

// 子要素を受け入れるための型定義を追加
interface NanodesuLinkProps extends LinkProps {
	children: ReactNode;
	className?: string;
}

export function NanodesuLink(props: NanodesuLinkProps) {
	const { children, ...restProps } = props;

	return (
		<Link
			className={'font-bold text-blue-500' + ' ' + (props.className || '')}
			{...restProps}
		>
			{children}
		</Link>
	)
}
