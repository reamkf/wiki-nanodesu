import { generateMetadata } from './metadata'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Sidebar } from '@/components/Sidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import './globals.css'
import { ReactScan } from '@/utils/reactScan'

export const metadata = generateMetadata({});

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
						<div className="w-full p-0 m-0 mr-2 mt-2 flex grow">
							<Sidebar />
							<div className="flex flex-col grow overflow-hidden overflow-x-auto">
								<main className="ml-0 p-3 grow scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 text-sm">
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