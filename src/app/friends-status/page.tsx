import FriendsStatusTable from "@/components/friends/FriendsStatusTable";
import { PageTitle } from "@/components/PageTitle";
import { getFriendsData } from "@/utils/friends";

export default async function FriendsStatus() {
	const friendsData = await getFriendsData();

	return (
		<main className="p-4">
			<PageTitle title="フレンズステータスランキング" />
			<p className="mb-4 text-xl font-bold">
				※このページは製作途中です。
			</p>
			<FriendsStatusTable friendsData={friendsData} />
		</main>
	);
}
