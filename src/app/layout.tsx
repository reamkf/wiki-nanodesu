// app/layout.tsx
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Sidebar } from '@/components/Sidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import './globals.css'

export const metadata: Metadata = {
	title: 'アプリ版けものフレンズ３wikiなのです',
	description: '非公式Wikiページ',
	icons: {
		icon: '/wiki-nanodesu/no_blue.png',
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ja">
			<body>
				<SidebarProvider>
					<div className="min-h-screen bg-white flex flex-col">
						<Header />
						<div className="w-full max-w-[1920px] p-0 m-0 flex flex-grow">
							<Sidebar />
							<div className="flex flex-col flex-grow">
								<main className="md:ml-86 ml-0 p-4 flex-grow">
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