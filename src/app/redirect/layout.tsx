import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'wikiなのだリダイレクト',
	description: 'wikiなのだのページへリダイレクトします',
	openGraph: {
		title: 'wikiなのだリダイレクト',
		description: 'wikiなのだのページへリダイレクトします',
	},
};

export default function RedirectLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4">
			{children}
		</div>
	);
}