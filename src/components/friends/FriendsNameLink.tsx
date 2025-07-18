import { FriendsDataRow } from "@/types/friends";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { getWikiNanodaPageUrl } from '@/utils/seesaawiki/encoding';
import { memo } from "react";

interface FriendsNameLinkProps {
	friend: FriendsDataRow;
}

export const FriendsNameLink = memo(function FriendsNameLink({ friend }: FriendsNameLinkProps) {
	const friendsName = friend.secondName ? `【${friend.secondName}】${friend.name}` : friend.name;
	const pageUrl = getWikiNanodaPageUrl(friendsName);
	return (
		<>
			<SeesaaWikiLink
				href={pageUrl}
				className="text-md"
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
});
