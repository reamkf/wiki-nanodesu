import FriendsStatusTable from "@/components/friends/FriendsStatusTable";
import { PageTitle } from "@/components/PageTitle";
import { getFriendsStatusList } from "@/utils/friendsStatus";

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
