import { SeesaaWikiImage } from "@/components/SeesaaWikiImage";
import { FriendsDataRow } from "@/types/friends";

interface FriendsIconProps {
	friendsData: FriendsDataRow;
	size: number;
}

export default function FriendsIcon({ friendsData, size }: FriendsIconProps) {
	return (
		<SeesaaWikiImage
			src={friendsData.iconUrl}
			alt="Friends Icon"
			width={size}
			height={size}
			referrerPolicy="no-referrer"
		/>
	);
}