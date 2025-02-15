'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';

export default function FriendsStatusPage() {
	const [isOpen, setIsOpen] = useState(false);
	const { toggle } = useSidebar();
	const router = useRouter();

	return (
		<div className="min-h-screen">
			<div className="">
				<h1 className="text-2xl font-bold mb-2">
					フレンズステータスランキング
				</h1>
				<p className="text-gray-600">
					じゅんびちゅうなのです
				</p>
			</div>
		</div>
	);
}
