import { FriendsDataRow } from "@/types/friends";
import Link from "next/link";
import { encodeEUCJP } from "@/utils/encoding";

interface FriendsNameLinkProps {
	friend: FriendsDataRow;
}

export function FriendsNameLink({ friend }: FriendsNameLinkProps) {
	const friendsName = friend.second_name ? `【${friend.second_name}】${friend.name}` : friend.name;
	const encodedFriendsName = encodeEUCJP(friendsName);
	const pageUrl = `https://seesaawiki.jp/kemono_friends3_5ch/d/${encodedFriendsName}`;
	return (
		<>
			<Link
				href={pageUrl}
				className="text-md text-gray-500 hover:underline"
				rel="noopener noreferrer"
			>
				{friend.second_name && (
					<span className="text-xs text-gray-500 text-red-500 p-0 m-0">
						【{friend.second_name}】
						<br />
					</span>
				)}
				{friend.name}
			</Link>
		</>
	);
}
