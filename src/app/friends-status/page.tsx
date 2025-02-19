import FriendsStatusTable from "@/components/friends/FriendsStatusTable";
import { PageTitle } from "@/components/PageTitle";
import { FriendsStatusListItem } from "@/types/friends";
import { getFriendsData } from "@/utils/friendsData";
// import { getInitialLv } from "@/utils/friendsStatus";

export async function getFriendsStatusList(): Promise<FriendsStatusListItem[]> {
	const friendsData = await getFriendsData();

	const result = await Promise.all(friendsData.map(async friend => {
		// const initialLv = await getInitialLv(friend);
		return [
			// {
			// 	friendsDataRow: friend,
			// 	level: initialLv,
			// 	rank: friend.rarity,
			// 	yasei: 4 as const,
			// 	status: friend.status.statusInitial,
			// 	statusType: '初期ステータス' as const
			// },
			{
				friendsDataRow: friend,
				level: 90,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status90,
				statusType: '☆6/Lv90/野生4' as const
			},
			{
				friendsDataRow: friend,
				level: 99,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status99,
				statusType: '☆6/Lv99/野生4' as const
			},
			{
				friendsDataRow: friend,
				level: 200,
				rank: 6,
				yasei: 4 as const,
				status: friend.status.status200,
				statusType: '☆6/Lv200/野生4' as const
			},
			{
				friendsDataRow: friend,
				level: 90,
				rank: 6,
				yasei: 5 as const,
				status: friend.status.status90Yasei5,
				statusType: '☆6/Lv90/野生5' as const
			},
			{
				friendsDataRow: friend,
				level: 99,
				rank: 6,
				yasei: 5 as const,
				status: friend.status.status99Yasei5,
				statusType: '☆6/Lv99/野生5' as const
			},
			{
				friendsDataRow: friend,
				level: 200,
				rank: 6,
				yasei: 5 as const,
				status: friend.status.status200Yasei5,
				statusType: '☆6/Lv200/野生5' as const
			}
		];
	}));

	return result.flat();
}

export default async function FriendsStatus() {
	const friendsStatusList = await getFriendsStatusList();

	return (
		<main className="p-4">
			<PageTitle title="フレンズステータスランキング" />
			<p className="mb-4 text-xl font-bold">
				※このページは製作途中です。
			</p>
			<FriendsStatusTable friendsStatusList={friendsStatusList} />
		</main>
	);
}
