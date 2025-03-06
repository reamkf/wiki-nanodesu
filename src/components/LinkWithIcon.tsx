import Link from 'next/link';
import LinkIcon from '@mui/icons-material/Link';

interface GoogleSheetsLinkProps {
	link: string;
	title?: string;
	className?: string;
	iconClassName?: string;
	textClassName?: string;
	prefixElement?: React.ReactNode;
	suffixElement?: React.ReactNode;
}

export default function GoogleSheetsLink({ link, title, className, iconClassName, textClassName, prefixElement, suffixElement }: GoogleSheetsLinkProps) {
	return (
		<Link href={link} target="_blank" className={`flex w-fit items-center gap-[0.125rem] ${className}`}>
			{prefixElement}
			<LinkIcon className={`text-blue-700 inline-block text-xl transform -rotate-45 ${iconClassName}`} />
			<span className={`${textClassName}`}>
				{title ? title : link.length > 57 ? link.slice(0, 60) + '...' : link}
			</span>
			{suffixElement}
		</Link>
	);
}
