import { FriendsDataRow } from "@/types/friends";
import Link from "next/link";
import { getWikiNanodaPageUrl } from "@/utils/encoding";

interface FriendsNameLinkProps {
	friend: FriendsDataRow;
}

export function FriendsNameLink({ friend }: FriendsNameLinkProps) {
	const friendsName = friend.second_name ? `【${friend.second_name}】${friend.name}` : friend.name;
	const pageUrl = getWikiNanodaPageUrl(friendsName);
	return (
		<>
			<Link
				href={pageUrl}
				className="text-md hover:underline"
				rel="noopener noreferrer"
			>
				{friend.second_name && (
					<div className="text-xs text-red-500 p-0 m-0">
						【{friend.second_name}】
					</div>
				)}
				{friend.name}
			</Link>
		</>
	);
}
