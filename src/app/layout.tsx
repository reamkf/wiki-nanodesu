// app/layout.tsx
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import './globals.css'

export const metadata: Metadata = {
	title: 'アプリ版けものフレンズ３wikiなのです',
	description: '非公式Wikiページ',
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
					<div className="min-h-screen bg-white">
						<Header />
						<div className="container mx-auto px-4 py-8 mx-0 flex relative">
							<Sidebar />
							<main className="flex-grow md:ml-86 ml-0">
								{children}
							</main>
						</div>
					</div>
				</SidebarProvider>
			</body>
		</html>
	)
}