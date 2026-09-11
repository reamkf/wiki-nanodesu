import { FriendsDataRow } from "@/types/friends";
import { NanodesuLink } from "@/components/common/NanodesuLink";
import { memo } from "react";

interface FriendsNameLinkProps {
	friend: FriendsDataRow;
}

export const FriendsNameLink = memo(function FriendsNameLink({ friend }: FriendsNameLinkProps) {
	const pageUrl = `/friends/${encodeURIComponent(friend.id)}`;
	return (
		<NanodesuLink href={pageUrl} className="text-md">
			{friend.secondName && (
				<div className="text-xs text-red-500 p-0 m-0">{friend.secondName}</div>
			)}
			{friend.name}
		</NanodesuLink>
	);
});
