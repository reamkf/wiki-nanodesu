import Image from "next/image";
import { FriendsDataRow } from "@/types/friends";

interface FriendsIconProps {
	friendsData: FriendsDataRow;
	size: number;
}

export default function FriendsIcon({ friendsData, size }: FriendsIconProps) {
	return (
		<Image
			src={friendsData.icon_url}
			alt="Friends Icon"
			width={size}
			height={size}
			referrerPolicy="no-referrer"
		/>
	);
}