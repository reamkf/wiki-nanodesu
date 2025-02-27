// app/layout.tsx
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Sidebar } from '@/components/Sidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import './globals.css'
import { ReactScan } from '@/utils/reactScan'

export const metadata: Metadata = {
	title: 'アプリ版けものフレンズ３wikiなのです',
	description: 'アプリ版けものフレンズ３wikiなのだ！の補助ページ',
	icons: {
		icon: '/wiki-nanodesu/no_blue.png',
	},
	openGraph: {
		title: 'アプリ版けものフレンズ３wikiなのです',
		description: 'アプリ版けものフレンズ３wikiなのだ！の補助ページ',
		url: 'https://reamkf.github.io/wiki-nanodesu/',
		siteName: 'アプリ版けものフレンズ３wikiなのです',
		images: [
			{
				url: 'https://reamkf.github.io/wiki-nanodesu/no_blue.png',
				width: 256,
				height: 256,
				alt: 'アプリ版けものフレンズ３wikiなのです',
			},
		],
		locale: 'ja_JP',
		type: 'website',
	},
	twitter: {
		card: 'summary',
		title: 'アプリ版けものフレンズ３wikiなのです',
		description: 'アプリ版けものフレンズ３wikiなのだ！の補助ページ',
		images: {
			url: 'https://reamkf.github.io/wiki-nanodesu/no_blue.png',
			alt: 'アプリ版けものフレンズ３wikiなのです',
		},
	}
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ja">
			<ReactScan />
			<body>
				<SidebarProvider>
					<div className="min-h-screen bg-white flex flex-col">
						<Header />
						<div className="w-full max-w-[1920px] p-0 m-0 mt-2 flex flex-grow">
							<Sidebar />
							<div className="flex flex-col flex-grow overflow-hidden">
								<main className="md:ml-86 ml-0 p-3 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 text-sm">
									{children}
								</main>
								<Footer />
							</div>
						</div>
					</div>
				</SidebarProvider>
			</body>
		</html>
	)
}