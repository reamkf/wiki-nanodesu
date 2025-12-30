"use client";

import SearchIcon from '@mui/icons-material/Search';
import { useState } from "react";
import { SeesaaWikiImage } from "@/components/seesaawiki/SeesaaWikiImage";
import { FriendsDetailModal } from "@/components/friends/FriendsDetailModal";
import { FriendsDataRow } from "@/types/friends";

interface FriendsIconProps {
	friendsData: FriendsDataRow;
	size: number;
}

export default function FriendsIcon({ friendsData, size }: FriendsIconProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				aria-label={`${friendsData.name}の詳細を表示`}
				onClick={() => setIsOpen(true)}
				className="relative inline-block"
			>
				<SeesaaWikiImage
					src={friendsData.iconUrl}
					alt={friendsData.name}
					width={size}
					height={size}
					referrerPolicy="no-referrer"
				/>

				<span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-white rounded-full overflow-hidden p-[2px]">
					<SearchIcon fontSize="small" />
				</span>
			</button>

			<FriendsDetailModal
				friend={friendsData}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
			/>
		</>
	);
}