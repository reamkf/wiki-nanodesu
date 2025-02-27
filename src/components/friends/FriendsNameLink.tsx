import { FriendsDataRow } from "@/types/friends";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { getWikiNanodaPageUrl } from "@/utils/encoding";

interface FriendsNameLinkProps {
	friend: FriendsDataRow;
}

export function FriendsNameLink({ friend }: FriendsNameLinkProps) {
	const friendsName = friend.secondName ? `【${friend.secondName}】${friend.name}` : friend.name;
	const pageUrl = getWikiNanodaPageUrl(friendsName);
	return (
		<>
			<SeesaaWikiLink
				href={pageUrl}
				className="text-md hover:underline"
			>
				{friend.secondName && (
					<div className="text-xs text-red-500 p-0 m-0">
						【{friend.secondName}】
					</div>
				)}
				{friend.name}
			</SeesaaWikiLink>
		</>
	);
}
